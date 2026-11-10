/* ============================================================
   OCB store · application logic
   Everything you would want to change lives in config.js.
   This file reads it and builds the shop.
   ============================================================ */
(function () {
"use strict";

var C = window.OCB_CONFIG;
if (!C || !Array.isArray(C.products)) {
  document.getElementById("loader").remove();
  document.body.insertAdjacentHTML("beforeend",
    '<p style="padding:120px 24px;max-width:560px;margin:auto;font-family:sans-serif;line-height:1.6">' +
    "<b>config.js could not be read.</b><br>It usually means a missing comma or quote mark in the last line you edited. " +
    "Undo the last change in config.js and upload it again.</p>");
  return;
}

/* ---------- small helpers ---------- */
var $ = function (s, c) { return (c || document).querySelector(s); };
var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
var esc = function (s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
  });
};
var ls = {
  get: function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
};
var icon = function (id, cls) { return '<svg class="' + (cls || "icon") + '" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; };
var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
var raf = function (fn) { var q = false; return function () { if (!q) { q = true; requestAnimationFrame(function () { q = false; fn(); }); } }; };

var B = C.brand || {};
var CUR = C.currency || {};
var SHIP = C.shipping || {};
var NF = new Intl.NumberFormat(CUR.locale || "en-IN", { maximumFractionDigits: 2 });
var money = function (n) { return (CUR.symbol || "₹") + NF.format(n); };
var COUNTRIES = (SHIP.countries && SHIP.countries.length) ? SHIP.countries : ["India"];
var INDIA_ONLY = COUNTRIES.length === 1 && /india/i.test(COUNTRIES[0]);
var WA = String(B.whatsapp || "").replace(/\D/g, "");
var US_ONLY = COUNTRIES.length === 1 && /united states|usa|^us$/i.test(COUNTRIES[0]);
var INR = (CUR.code || "INR") === "INR";
var TAX = CUR.taxNote || "";
var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/* which optional features are switched on (decided purely by config.js) */
var F = {
  wa: WA.length >= 8,
  rzp: !!(C.razorpay && C.razorpay.keyId && C.razorpay.workerUrl),
  fb: !!(C.firebase && C.firebase.apiKey && C.firebase.projectId)
};
var SI = C.signIn || {};

var P = {};
C.products.forEach(function (p) {
  p.images = p.images && p.images.length ? p.images : ["icons/icon-512.png"];
  p.sizes = p.sizes && p.sizes.length ? p.sizes : ["One size"];
  p.soldOutSizes = p.soldOutSizes || [];
  P[p.id] = p;
});

var state = { user: null, authReady: !F.fb, addresses: ls.get("ocb_addr_v1", []), orders: ls.get("ocb_orders_v1", []), remoteOrders: null };
var vHome = $("#vHome"), vPage = $("#vPage");

/* ============================================================
   TOASTS
   ============================================================ */
function toast(msg, o) {
  o = o || {};
  var t = document.createElement("div");
  t.className = "toast" + (o.err ? " err" : "");
  t.innerHTML = (o.img ? '<img src="' + esc(o.img) + '" alt="">' : "") +
    "<div><b>" + esc(msg) + "</b>" + (o.sub ? "<small>" + esc(o.sub) + "</small>" : "") + "</div>" +
    (o.action ? "<button>" + esc(o.action) + "</button>" : "");
  if (o.action) $("button", t).addEventListener("click", function () { kill(); o.onAction(); });
  $("#toasts").appendChild(t);
  var dead = false;
  function kill() { if (dead) return; dead = true; t.classList.add("out"); setTimeout(function () { t.remove(); }, 380); }
  setTimeout(kill, o.ms || 4200);
}

/* ============================================================
   CART
   ============================================================ */
var Cart = {
  items: ls.get("ocb_cart_v1", []).filter(function (i) { return P[i.id] && i.qty > 0; }),
  save: function () { ls.set("ocb_cart_v1", this.items); this.paint(); },
  add: function (id, size, qty) {
    var hit = this.items.filter(function (i) { return i.id === id && i.size === size; })[0];
    if (hit) hit.qty = Math.min(10, hit.qty + qty); else this.items.push({ id: id, size: size, qty: Math.min(10, qty) });
    this.save();
    var c = $("#cartCount"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
  },
  setQty: function (i, q) { if (!this.items[i]) return; this.items[i].qty = Math.max(1, Math.min(10, q)); this.save(); },
  remove: function (i) { this.items.splice(i, 1); this.save(); },
  clear: function () { this.items = []; this.save(); },
  count: function () { return this.items.reduce(function (n, i) { return n + i.qty; }, 0); },
  subtotal: function () { return this.items.reduce(function (n, i) { return n + P[i.id].price * i.qty; }, 0); },
  shipping: function () {
    var s = this.subtotal(), flat = Number(SHIP.flatRate) || 0, free = Number(SHIP.freeAbove) || 0;
    if (!this.items.length || !flat) return 0;
    return (free && s >= free) ? 0 : flat;
  },
  total: function () { return this.subtotal() + this.shipping(); },
  lines: function () {
    return this.items.map(function (i) {
      var p = P[i.id];
      return { id: p.id, name: p.name, colour: p.colour || "", size: i.size, qty: i.qty, price: p.price, image: p.images[0] };
    });
  },
  paint: function () {
    var n = this.count(), c = $("#cartCount");
    c.textContent = n; c.classList.toggle("on", n > 0);
    $("#btnCart").setAttribute("aria-label", "Open cart, " + n + (n === 1 ? " item" : " items"));
    $("#drawerCount").textContent = n ? n : "";
    paintDrawer();
    if (current.view === "checkout") renderCheckout();
  }
};

function paintDrawer() {
  var body = $("#drawerBody"), foot = $("#drawerFoot"), ship = $("#drawerShip");
  if (!Cart.items.length) {
    ship.hidden = true;
    body.innerHTML = '<div class="drawer__empty"><svg viewBox="0 0 724 1126" aria-hidden="true"><use href="#ocbMark"/></svg>' +
      "<h3 class=\"display\" style=\"font-size:1.6rem\">Nothing here yet</h3><p>Two pieces are waiting. Pick the side you wear.</p>" +
      '<a href="#/shop" class="btn btn--fill" data-close><span>Shop the drop</span></a></div>';
    foot.innerHTML = "";
    foot.hidden = true;
    return;
  }
  foot.hidden = false;
  var free = Number(SHIP.freeAbove) || 0, flat = Number(SHIP.flatRate) || 0, sub = Cart.subtotal();
  if (free && flat) {
    ship.hidden = false;
    var left = free - sub;
    ship.innerHTML = (left > 0 ? "Add " + money(left) + " more for free shipping" : "You have free shipping") +
      '<i><b style="width:' + Math.min(100, sub / free * 100) + '%"></b></i>';
  } else ship.hidden = true;
  body.innerHTML = Cart.items.map(function (it, i) {
    var p = P[it.id];
    return '<div class="line" data-i="' + i + '"><a href="#/product/' + p.id + '" data-close><img src="' + esc(p.images[0]) + '" alt=""></a><div>' +
      '<div class="line__top"><b>' + esc(p.name) + "</b><span>" + money(p.price * it.qty) + "</span></div>" +
      "<small>" + esc(p.colour || "") + (p.colour ? ", " : "") + "size " + esc(it.size) + "</small>" +
      '<div class="line__bot"><div class="qty qty--sm"><button data-q="-1" aria-label="One less">−</button><output>' + it.qty +
      '</output><button data-q="1" aria-label="One more">+</button></div><button class="line__rm" data-rm>Remove</button></div></div></div>';
  }).join("");
  var sh = Cart.shipping();
  foot.innerHTML = '<div class="drawer__sub"><span>Subtotal</span><span>' + money(sub) + "</span></div>" +
    "<small>" + (sh ? "Shipping " + money(sh) + " added at checkout." : "Shipping is free.") + (TAX ? " " + esc(TAX) + "." : "") + "</small>" +
    '<a href="#/checkout" class="btn btn--fill btn--block" data-close><span>Checkout ' + icon("arrow") + "</span></a>";
}
$("#drawerBody").addEventListener("click", function (e) {
  var line = e.target.closest(".line"); if (!line) return;
  var i = +line.dataset.i, q = e.target.closest("[data-q]");
  if (q) { Cart.setQty(i, Cart.items[i].qty + (+q.dataset.q)); return; }
  if (e.target.closest("[data-rm]")) {
    line.classList.add("bye");
    setTimeout(function () { Cart.remove(i); }, RM ? 0 : 320);
  }
});

/* little photo that flies into the cart icon */
function fly(img) {
  if (RM || !img) return;
  var a = img.getBoundingClientRect(), b = $("#btnCart").getBoundingClientRect();
  var w = Math.min(a.width, 150), h = w * 1.25;
  var f = document.createElement("img");
  f.className = "fly"; f.src = img.currentSrc || img.src; f.alt = "";
  f.style.cssText = "left:" + (a.left + a.width / 2 - w / 2) + "px;top:" + (a.top + a.height / 2 - h / 2) + "px;width:" + w + "px;height:" + h + "px";
  document.body.appendChild(f);
  requestAnimationFrame(function () {
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    f.style.transform = "translate(" + dx + "px," + dy + "px) scale(.12)";
    f.style.opacity = ".2";
  });
  setTimeout(function () { f.remove(); }, 900);
}
function addToCart(id, size, qty, img, thenOpen) {
  Cart.add(id, size, qty);
  $("#head").classList.remove("hide");
  fly(img);
  if (thenOpen !== false) setTimeout(openDrawer, RM ? 0 : 620);
}

/* ============================================================
   OVERLAYS: drawer, modal, menu
   ============================================================ */
var lastFocus = null;
function lock(on) { document.body.classList.toggle("is-locked", on); }
function anyOpen() { return $("#drawer").classList.contains("open") || $("#modal").classList.contains("open") || $("#menu").classList.contains("open"); }
function focusIn(el) { var f = $("button,[href],input,select,textarea", el); if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60); }
function trap(e, el) {
  if (e.key !== "Tab") return;
  var f = $$("button,[href],input,select,textarea", el).filter(function (n) { return n.offsetParent !== null && !n.disabled; });
  if (!f.length) return;
  if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
  else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
}
function openDrawer() {
  if ($("#modal").classList.contains("open")) return;
  lastFocus = document.activeElement;
  paintDrawer();
  $("#drawer").classList.add("open"); $("#scrim").classList.add("on"); lock(true);
  focusIn($("#drawer"));
}
function closeDrawer() {
  $("#drawer").classList.remove("open");
  if (!$("#modal").classList.contains("open")) { $("#scrim").classList.remove("on"); lock(false); }
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
var modalOnClose = null;
function openModal(html, o) {
  o = o || {};
  closeDrawer(); closeMenu();
  lastFocus = document.activeElement;
  var p = $("#modalPanel");
  p.className = "modal__panel" + (o.wide ? " modal__panel--wide" : "");
  p.innerHTML = '<button class="x" data-x aria-label="Close">' + icon("x") + "</button>" + html;
  $("#modal").setAttribute("aria-label", o.label || "Dialog");
  $("#modal").classList.add("open"); $("#scrim").classList.add("on"); lock(true);
  modalOnClose = o.onClose || null;
  p.scrollTop = 0;
  focusIn(p);
  return p;
}
function closeModal() {
  if (!$("#modal").classList.contains("open")) return;
  $("#modal").classList.remove("open"); $("#scrim").classList.remove("on"); lock(false);
  if (modalOnClose) { var f = modalOnClose; modalOnClose = null; f(); }
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
function openMenu() { $("#menu").classList.add("open"); $("#btnMenu").setAttribute("aria-expanded", "true"); lock(true); focusIn($("#menu")); }
function closeMenu() {
  if (!$("#menu").classList.contains("open")) return;
  $("#menu").classList.remove("open"); $("#btnMenu").setAttribute("aria-expanded", "false"); lock(false);
}
$("#btnCart").addEventListener("click", openDrawer);
$("#drawerClose").addEventListener("click", closeDrawer);
$("#btnMenu").addEventListener("click", openMenu);
$("#menuClose").addEventListener("click", closeMenu);
$("#scrim").addEventListener("click", function () { closeDrawer(); closeModal(); });
$("#modal").addEventListener("click", function (e) { if (e.target === $("#modal") || e.target.closest("[data-x]")) closeModal(); });
$("#drawer").addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeDrawer(); });
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    if ($("#zoom").classList.contains("open")) closeZoom();
    else if ($("#modal").classList.contains("open")) closeModal();
    else if ($("#drawer").classList.contains("open")) closeDrawer();
    else closeMenu();
  }
  if ($("#modal").classList.contains("open")) trap(e, $("#modalPanel"));
  else if ($("#drawer").classList.contains("open")) trap(e, $("#drawer"));
  else if ($("#menu").classList.contains("open")) trap(e, $("#menu"));
});
function openZoom(src, alt) { $("#zoomImg").src = src; $("#zoomImg").alt = alt || ""; $("#zoom").classList.add("open"); lock(true); }
function closeZoom() { $("#zoom").classList.remove("open"); lock(false); }
$("#zoom").addEventListener("click", closeZoom);

/* ============================================================
   REVEALS + MARK DRAWING
   ============================================================ */
var MARK_D = $("#ocbMark path").getAttribute("d");
function markSVG() {
  return '<svg viewBox="0 0 724 1126" aria-hidden="true"><g transform="translate(0,1126) scale(0.1,-0.1)"><path d="' + MARK_D + '"/></g></svg>';
}
function setLen(root) {
  $$("path", root).forEach(function (p) { try { p.style.setProperty("--len", Math.ceil(p.getTotalLength())); } catch (e) {} });
}
var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (es) {
  es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
}, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" }) : null;
function observe(root) {
  $$("[data-rv],.mask,[data-draw]", root).forEach(function (el) {
    if (el.classList.contains("in")) return;
    if (!io || RM) el.classList.add("in"); else io.observe(el);
  });
}
function title2(lines) { return (lines || []).map(function (l) { return '<span class="mask"><span>' + esc(l) + "</span></span>"; }).join(""); }

/* ============================================================
   HOME: fill every section from config.js
   ============================================================ */
function sizeChips(p, pressed) {
  return p.sizes.map(function (s) {
    var out = p.soldOutSizes.indexOf(s) > -1;
    return '<button class="chip" data-size="' + esc(s) + '"' + (out ? ' disabled aria-label="' + esc(s) + ', sold out"' : "") +
      (pressed !== undefined ? ' aria-pressed="' + (pressed === s) + '"' : "") + ">" + esc(s) + "</button>";
  }).join("");
}
function priceHTML(p) {
  return "<b>" + money(p.price) + "</b>" + (p.compareAt > p.price ? "<s>" + money(p.compareAt) + "</s>" : "");
}
function buildHome() {
  /* announcement strip */
  var msgs = (C.announcement || []).filter(Boolean), strip = $("#strip");
  if (msgs.length) {
    strip.hidden = false;
    strip.innerHTML = msgs.map(function (m, i) { return '<p class="' + (i ? "" : "on") + '">' + esc(m) + "</p>"; }).join("");
    if (msgs.length > 1 && !RM) {
      var k = 0, ps = $$("p", strip);
      setInterval(function () {
        var a = ps[k]; k = (k + 1) % ps.length; var b = ps[k];
        a.classList.add("out"); a.classList.remove("on"); b.classList.remove("out"); b.classList.add("on");
        setTimeout(function () { a.classList.remove("out"); }, 800);
      }, 4200);
    }
  }
  document.documentElement.style.setProperty("--head-h", (msgs.length ? 96 : 64) + "px");

  /* hero */
  var H = C.hero || {};
  $("#heroTitle").innerHTML = (H.lines || []).map(function (l) { return '<span class="ln"><span>' + esc(l) + "</span></span>"; }).join("");
  $("#heroSub").textContent = H.sub || "";
  $("#heroBtn").textContent = H.button || "Shop the drop";
  var bg = $("#heroBg");
  if (H.blackAndWhite !== false) bg.classList.add("mono");
  if (H.poster) bg.innerHTML = '<img src="' + esc(H.poster) + '" alt="" fetchpriority="high" decoding="async">';
  heroVideo(bg, H.videos || []);

  /* marquee */
  var words = C.marquee || [];
  if (words.length) {
    var seg = "<div>" + words.map(function (w) { return "<span>" + esc(w) + "</span>" + icon("diamond", "d"); }).join("") + "</div>";
    $("#marquee").innerHTML = seg + seg + seg + seg;
  } else $(".marquee").hidden = true;

  /* shop */
  var S = C.shop || {};
  $("#shopTitle").innerHTML = title2(S.title);
  $("#shopIntro").textContent = S.intro || "";
  var dip = $("#dip");
  if (C.products.length !== 2) dip.classList.add("dip--grid");
  dip.innerHTML = C.products.map(function (p) {
    var alt = p.images[1];
    return '<article class="dip__side' + (alt ? " has-alt" : "") + '" data-theme="' + (p.theme === "light" ? "light" : "dark") + '" style="--pbg:' + esc(p.background || "") + '">' +
      '<a class="dip__link" href="#/product/' + p.id + '" data-cursor="view" aria-label="' + esc(p.name + ", " + (p.colour || "") + ", " + money(p.price)) + '">' +
      (p.badge ? '<span class="dip__badge">' + esc(p.badge) + "</span>" : "") +
      '<img class="main" src="' + esc(p.images[0]) + '" alt="' + esc(p.name + " tee, " + (p.colour || "")) + '" loading="lazy" decoding="async">' +
      (alt ? '<img class="alt" src="' + esc(alt) + '" alt="" loading="lazy" decoding="async">' : "") + "</a>" +
      '<div class="dip__info"><div><h3 class="dip__name"><a href="#/product/' + p.id + '">' + esc(p.name) + "</a></h3>" +
      '<p class="dip__meta"><span>' + esc(p.colour || "") + "</span>" + priceHTML(p) + "</p></div>" +
      '<div class="quick" data-quick="' + p.id + '"><button class="btn btn--sm quick__open" aria-expanded="false"><span>Quick add</span></button>' +
      '<div class="quick__sizes" role="group" aria-label="Pick a size to add ' + esc(p.name) + ' to your cart">' + sizeChips(p) + "</div></div></div></article>";
  }).join("");
  dip.addEventListener("click", function (e) {
    var q = e.target.closest(".quick"); if (!q) return;
    if (e.target.closest(".quick__open")) {
      $$(".quick.open", dip).forEach(function (o) { o.classList.remove("open"); });
      q.classList.add("open"); var f = $(".chip:not([disabled])", q); if (f) f.focus();
      return;
    }
    var chip = e.target.closest(".chip");
    if (chip) {
      addToCart(q.dataset.quick, chip.dataset.size, 1, $("img.main", q.closest(".dip__side")));
      q.classList.remove("open");
    }
  });

  /* promises */
  var pr = C.promises || [];
  $("#promises").innerHTML = pr.map(function (x) { return "<div data-rv><h3>" + esc(x.title) + "</h3><p>" + esc(x.text) + "</p></div>"; }).join("");
  $("#promises").hidden = !pr.length;

  /* look closer: every photo after the first, from every product */
  var tiles = [];
  C.products.forEach(function (p) { p.images.slice(1).forEach(function (src) { tiles.push({ p: p, src: src }); }); });
  if (tiles.length >= 2) {
    var K = C.closer || {};
    $("#closerTitle").innerHTML = title2(K.title);
    $("#closerIntro").textContent = K.intro || "";
    $("#rail").innerHTML = tiles.map(function (t) {
      return '<a class="rail__tile" href="#/product/' + t.p.id + '" data-cursor="view"><img src="' + esc(t.src) + '" alt="' + esc(t.p.name) + ' print, close up" loading="lazy" decoding="async" draggable="false"><span>' + esc(t.p.name) + "</span></a>";
    }).join("");
    dragScroll($("#rail"));
  } else $("#closer").hidden = true;

  /* philosophy, about */
  var Ph = C.philosophy || {};
  $("#philoTitle").innerHTML = title2(Ph.title);
  $("#philoBody").innerHTML = (Ph.paragraphs || []).map(function (t) { return "<p data-rv>" + esc(t) + "</p>"; }).join("");
  $("#philoSigil").innerHTML = markSVG(); setLen($("#philoSigil"));
  $("#aboutBody").innerHTML = ((C.about || {}).paragraphs || []).map(function (t) { return "<p data-rv>" + esc(t) + "</p>"; }).join("");

  /* faq */
  var faq = C.faq || [];
  $("#faqList").innerHTML = faq.map(function (f) { return accItem(f.q, "<p>" + esc(f.a) + "</p>"); }).join("");
  if (!faq.length) $("#help").hidden = true;

  /* newsletter */
  var N = C.newsletter || {};
  if (N.endpoint) { $("#newsTitle").textContent = N.title || ""; $("#newsSub").textContent = N.sub || ""; newsletter(N.endpoint); }
  else $("#news").hidden = true;

  /* contact rows + footer + menu foot */
  var rows = [];
  if (B.email) rows.push(["Email", B.email, "mailto:" + B.email]);
  if (F.wa) rows.push(["WhatsApp", "Message us", waLink("Hi OCB, I have a question.")]);
  if (B.instagram) rows.push(["Instagram", "@" + B.instagram, "https://instagram.com/" + B.instagram]);
  $("#contactRows").innerHTML = rows.map(function (r) {
    return '<a class="contact__row" href="' + esc(r[2]) + '"' + (/^http/.test(r[2]) ? ' target="_blank" rel="noopener"' : "") + " data-rv><span>" + r[0] + "</span><span>" + esc(r[1]) + " " + icon("arrow", "") + "</span></a>";
  }).join("");
  $("#footShop").innerHTML = C.products.map(function (p) { return '<li><a href="#/product/' + p.id + '">' + esc(p.name) + "</a></li>"; }).join("");
  var more = $("#footMore");
  if (B.instagram) more.insertAdjacentHTML("beforeend", '<li><a href="https://instagram.com/' + esc(B.instagram) + '" target="_blank" rel="noopener">Instagram</a></li>');
  if (!Install.standalone) more.insertAdjacentHTML("beforeend", '<li><button data-install>Get the app</button></li>');
  $("#footCopy").textContent = "© " + new Date().getFullYear() + " " + (B.name || "OCB") + ", " + (B.fullName || "") + ". All rights reserved.";
  $("#menuFoot").innerHTML = (F.fb ? '<a class="link" href="#/account">Account</a>' : "") +
    (B.instagram ? '<a class="link" href="https://instagram.com/' + esc(B.instagram) + '" target="_blank" rel="noopener">Instagram</a>' : "") +
    (F.wa ? '<a class="link" href="' + esc(waLink("Hi OCB, I have a question.")) + '" target="_blank" rel="noopener">WhatsApp</a>' : "") +
    (!Install.standalone ? '<button class="link" data-install>Get the app</button>' : "");
  observe(vHome);
}

function accItem(q, html, open) {
  return '<div class="acc__item' + (open ? " open" : "") + '"><button class="acc__q" aria-expanded="' + !!open + '"><span>' + esc(q) + '</span><i></i></button><div class="acc__a"><div>' + html + "</div></div></div>";
}
document.addEventListener("click", function (e) {
  var q = e.target.closest(".acc__q"); if (!q) return;
  var it = q.parentNode, on = !it.classList.contains("open");
  it.classList.toggle("open", on); q.setAttribute("aria-expanded", on);
});

function heroVideo(bg, list) {
  var saver = navigator.connection && navigator.connection.saveData;
  if (!list.length || RM || saver) return;
  var vids = list.map(function (src, i) {
    var v = document.createElement("video");
    v.muted = true; v.playsInline = true; v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    v.preload = i ? "none" : "auto"; v.src = src; v.loop = list.length === 1;
    bg.appendChild(v); return v;
  });
  var cur = 0, live = true;
  function play(i) {
    var v = vids[i];
    var pr = v.play();
    if (pr && pr.then) pr.then(function () {
      v.classList.add("on");
      vids.forEach(function (o, j) { if (j !== i) setTimeout(function () { o.classList.remove("on"); o.pause(); o.currentTime = 0; }, 1400); });
      if (vids[(i + 1) % vids.length].preload === "none") vids[(i + 1) % vids.length].preload = "auto";
    }).catch(function () {});
    cur = i;
  }
  vids.forEach(function (v, i) { v.addEventListener("ended", function () { if (live) play((i + 1) % vids.length); }); });
  play(0);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
    live = es[0].isIntersecting;
    if (live) { if (vids[cur].paused) play(cur); } else vids[cur].pause();
  }, { threshold: 0.05 }).observe(bg);
}

/* click-and-drag sideways scrolling for mouse users (touch already scrolls natively) */
function dragScroll(el, onEnd) {
  var down = false, sx = 0, sl = 0, moved = 0;
  el.addEventListener("pointerdown", function (e) {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    down = true; sx = e.clientX; sl = el.scrollLeft; moved = 0;
  });
  window.addEventListener("pointermove", function (e) {
    if (!down) return;
    var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
    if (moved > 6) { el.classList.add("drag"); el.scrollLeft = sl - dx; }
  });
  window.addEventListener("pointerup", function () {
    if (!down) return; down = false;
    if (el.classList.contains("drag")) { setTimeout(function () { el.classList.remove("drag"); if (onEnd) onEnd(); }, 0); }
  });
  el.addEventListener("click", function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);
  el.addEventListener("dragstart", function (e) { e.preventDefault(); });
}

function newsletter(endpoint) {
  var form = $("#newsForm"), input = $("#newsEmail"), msg = $("#newsMsg"), busy = false;
  function say(t, err) { msg.textContent = t; msg.classList.toggle("err", !!err); }
  if (ls.get("ocb_news", 0)) { form.hidden = true; say("You're on the list. One email, when it matters."); }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); if (busy) return;
    var v = input.value.trim();
    if (!RE_EMAIL.test(v)) { say("Enter a valid email address", true); input.focus(); return; }
    busy = true; say("Sending…");
    var done = function () { busy = false; ls.set("ocb_news", 1); form.hidden = true; say("You're on the list. One email, when it matters."); };
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ email: v, source: "ocb-store", company: $("#newsHp").value || "" }) })
      .then(function (r) { return r.json(); })
      .then(function (d) { (d.result === "success" || d.result === "duplicate") ? done() : (busy = false, say("That didn't go through. Try again.", true)); })
      .catch(done);   /* Apps Script can hide its reply behind CORS even when it saved the row */
  });
}

function waLink(text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }

/* ============================================================
   ROUTER
   ============================================================ */
var SECTIONS = { shop: 1, idea: 1, about: 1, help: 1, contact: 1 };
var current = { view: null, arg: null };
function parseHash() { return location.hash.replace(/^#\/?/, "").split("?")[0].split("/").filter(Boolean).map(decodeURIComponent); }
function resolve() {
  var h = parseHash(), a = h[0], b = h[1];
  if (!a || SECTIONS[a]) return { view: "home", arg: a || null };
  if (a === "product" && P[b]) return { view: "product", arg: b };
  if (a === "checkout") return { view: "checkout" };
  if (a === "account" && F.fb) return { view: "account" };
  if (a === "order" && b) return { view: "order", arg: b };
  if (a === "policy" && ((C.policies || {})[b] || b === "contact")) return { view: "policy", arg: b };
  return { view: "home", arg: null };
}
function setTheme(t) { document.body.setAttribute("data-theme", t); vPage.setAttribute("data-theme", t); }
function scrollToSection(id, instant) {
  var el = id ? document.getElementById(id) : null;
  var y = el ? el.getBoundingClientRect().top + window.pageYOffset : 0;
  window.scrollTo({ top: Math.max(0, y), behavior: (instant || RM) ? "auto" : "smooth" });
}
var routing = false;
function route(first) {
  var r = resolve();
  closeDrawer(); closeMenu(); if (!first) closeModal();
  if (r.view === "home" && current.view === "home") { current.arg = r.arg; scrollToSection(r.arg); spy(r.arg); return; }
  var swap = function () {
    var bar = $("#buybar"); if (bar) bar.remove();
    current = r;
    var home = r.view === "home";
    vHome.classList.toggle("on", home); vPage.classList.toggle("on", !home);
    if (home) { setTheme("dark"); vPage.innerHTML = ""; document.title = "OCB — Original Clothing Brand"; }
    else if (r.view === "product") renderProduct(P[r.arg]);
    else if (r.view === "checkout") renderCheckout();
    else if (r.view === "account") renderAccount();
    else if (r.view === "order") renderOrder(r.arg);
    else if (r.view === "policy") renderPolicy(r.arg);
    $("#head").classList.remove("hide");
    document.documentElement.style.scrollBehavior = "auto";
    if (home && r.arg) scrollToSection(r.arg, true); else window.scrollTo(0, 0);
    document.documentElement.style.scrollBehavior = "";
    spy(home ? r.arg : (r.view === "product" ? "shop" : null));
    observe(home ? vHome : vPage);
    bindHover();
  };
  if (first || RM) { swap(); return; }
  if (routing) { swap(); return; }
  routing = true;
  var cu = $("#curtain");
  cu.className = "curtain cover";
  setTimeout(function () {
    swap();
    cu.className = "curtain leave";
    setTimeout(function () { cu.className = "curtain"; routing = false; }, 560);
  }, 430);
}
function spy(id) { $$("#navMid a").forEach(function (a) { a.classList.toggle("active", !!id && a.dataset.spy === id); }); }
window.addEventListener("hashchange", function () { route(false); });
document.addEventListener("click", function (e) {
  var a = e.target.closest('a[href^="#/"]');
  if (a && a.getAttribute("href") === (location.hash || "#/")) { e.preventDefault(); route(false); }
  if (e.target.closest("[data-install]")) { closeMenu(); Install.open(true); }
});

/* ============================================================
   PRODUCT PAGE
   ============================================================ */
function renderProduct(p) {
  setTheme(p.theme === "light" ? "light" : "dark");
  document.title = p.name + " — OCB";
  var others = C.products.filter(function (o) { return o.id !== p.id; });
  var n = p.images.length, sel = p.sizes.length === 1 ? p.sizes[0] : null, qty = 1;
  var notes = [];
  if (SHIP.note) notes.push(icon("truck") + "<span>" + esc(SHIP.note) + "</span>");
  if ((C.policies || {}).returns) notes.push(icon("return") + '<span>Easy returns. <a class="link" style="font-size:9.5px" href="#/policy/returns">Read the policy</a></span>');
  if (F.rzp) notes.push(icon("lock") + "<span>Secure payment by Razorpay</span>");

  vPage.innerHTML = '<div class="page"><div class="wrap">' +
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span>/</span><a href="#/shop">Shop</a><span>/</span><span>' + esc(p.name) + "</span></nav>" +
    '<div class="pdp">' +
    '<div class="gal' + (n > 1 ? " has-thumbs" : "") + '" id="gal" style="--pbg:' + esc(p.background || "") + '">' +
      '<div class="gal__stage"><div class="gal__track" id="galTrack" tabindex="0" aria-label="Product photos. Use the arrow keys to move.">' +
        p.images.map(function (src, i) {
          return '<div class="gal__slide"><img src="' + esc(src) + '" alt="' + esc(p.name + ", photo " + (i + 1) + " of " + n) + '" ' + (i ? 'loading="lazy"' : 'fetchpriority="high"') + ' decoding="async" draggable="false"></div>';
        }).join("") + "</div>" +
        (n > 1 ? '<button class="gal__arrow prev" aria-label="Previous photo">' + icon("left", "") + '</button><button class="gal__arrow next" aria-label="Next photo">' + icon("right", "") + "</button>" +
          '<span class="gal__count" id="galCount">1 / ' + n + '</span><div class="gal__bar"><i id="galBar"></i></div>' : "") +
      "</div>" +
      (n > 1 ? '<div class="gal__thumbs">' + p.images.map(function (src, i) {
        return '<button class="gal__thumb' + (i ? "" : " on") + '" data-go="' + i + '" aria-label="Photo ' + (i + 1) + '"><img src="' + esc(src) + '" alt="" loading="lazy"></button>';
      }).join("") + "</div>" : "") +
    "</div>" +
    '<div class="pdp__info">' +
      (p.badge ? '<span class="pdp__badge">' + esc(p.badge) + "</span>" : "") +
      '<h1 class="pdp__name">' + esc(p.name) + "</h1>" +
      (p.colour ? '<p class="pdp__colour">' + esc(p.colour) + "</p>" : "") +
      '<p class="pdp__price">' + money(p.price) + (p.compareAt > p.price ? "<s>" + money(p.compareAt) + "</s>" : "") + (TAX ? "<small>" + esc(TAX) + "</small>" : "") + "</p>" +
      (p.tagline ? '<p class="pdp__tag">' + esc(p.tagline) + "</p>" : "") +
      '<div class="pdp__row"><span class="label">Size <b id="sizeNow">' + (sel ? esc(sel) : "") + "</b></span>" +
        (C.sizeGuide ? '<button class="link" id="openGuide">Size guide</button>' : "") + "</div>" +
      '<div class="pdp__sizes" id="sizes" role="group" aria-label="Size">' + sizeChips(p, sel || "") + "</div>" +
      '<p class="pdp__hint" id="sizeHint" role="alert"></p>' +
      '<div class="pdp__buy"><div class="qty" aria-label="Quantity"><button data-q="-1" aria-label="One less">−</button><output id="qtyNow" aria-live="polite">1</output><button data-q="1" aria-label="One more">+</button></div>' +
        '<button class="btn btn--fill" id="addBtn"><span>Add to cart</span></button>' +
        '<button class="btn btn--now" id="buyBtn"><span>Buy it now ' + icon("arrow") + "</span></button></div>" +
      (notes.length ? '<ul class="pdp__notes">' + notes.map(function (x) { return "<li>" + x + "</li>"; }).join("") + "</ul>" : "") +
      '<div class="acc">' +
        (p.description ? accItem("The idea", "<p>" + esc(p.description) + "</p>", true) : "") +
        (p.details && p.details.length ? accItem("Details", "<ul>" + p.details.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>") : "") +
        (p.care && p.care.length ? accItem("Care", "<ul>" + p.care.map(function (d) { return "<li>" + esc(d) + "</li>"; }).join("") + "</ul>") : "") +
        accItem("Shipping and returns", "<p>" + esc(SHIP.note || "") + ' See <a href="#/policy/shipping" style="text-decoration:underline">shipping</a> and <a href="#/policy/returns" style="text-decoration:underline">returns</a>.' +
          (F.wa ? ' Questions? <a style="text-decoration:underline" target="_blank" rel="noopener" href="' + esc(waLink("Hi OCB, I have a question about " + p.name + ".")) + '">Ask on WhatsApp</a>.' : "") + "</p>") +
      "</div>" +
    "</div></div>" +
    (others.length ? '<section class="other"><p class="label">' + (others.length === 1 ? "The other side of the drop" : "More from the drop") + "</p>" +
      others.map(function (o) {
        return '<a class="other__card" href="#/product/' + o.id + '" data-cursor="view"><img src="' + esc(o.images[0]) + '" alt="" loading="lazy"><div><h3>' + esc(o.name) + "</h3><p>" + esc(o.colour || "") + ", " + money(o.price) + '</p><span class="link">View piece</span></div></a>';
      }).join("") + "</section>" : "") +
    "</div></div>";

  document.body.insertAdjacentHTML("beforeend", '<div class="buybar" id="buybar" data-theme="' + (p.theme === "light" ? "light" : "dark") + '"><div><b>' + esc(p.name) + "</b><small>" + money(p.price) + '</small></div><button class="btn btn--fill btn--sm" id="barBtn"><span>Add to cart</span></button></div>');

  /* gallery */
  var track = $("#galTrack"), idx = 0;
  function go(i) { i = Math.max(0, Math.min(n - 1, i)); track.scrollTo({ left: i * track.clientWidth, behavior: RM ? "auto" : "smooth" }); }
  function sync() {
    if (n < 2) return;
    $("#galCount").textContent = (idx + 1) + " / " + n;
    $("#galBar").style.width = ((idx + 1) / n * 100) + "%";
    $(".gal__arrow.prev").disabled = idx === 0; $(".gal__arrow.next").disabled = idx === n - 1;
    $$(".gal__thumb").forEach(function (t, i) { t.classList.toggle("on", i === idx); });
  }
  track.addEventListener("scroll", raf(function () {
    var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    if (i !== idx) { idx = i; sync(); }
  }), { passive: true });
  dragScroll(track, function () { go(Math.round(track.scrollLeft / Math.max(1, track.clientWidth))); });
  $("#gal").addEventListener("click", function (e) {
    var t = e.target.closest("[data-go]"); if (t) return go(+t.dataset.go);
    if (e.target.closest(".prev")) return go(idx - 1);
    if (e.target.closest(".next")) return go(idx + 1);
    var s = e.target.closest(".gal__slide"); if (s) openZoom($("img", s).src, $("img", s).alt);
  });
  track.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
  });
  sync();

  /* size, quantity, add */
  function pick(s) {
    sel = s; $("#sizeNow").textContent = s; $("#sizeHint").textContent = "";
    $$("#sizes .chip").forEach(function (c) { c.setAttribute("aria-pressed", c.dataset.size === s); });
  }
  $("#sizes").addEventListener("click", function (e) { var c = e.target.closest(".chip"); if (c) pick(c.dataset.size); });
  $(".pdp__buy .qty").addEventListener("click", function (e) {
    var b = e.target.closest("[data-q]"); if (!b) return;
    qty = Math.max(1, Math.min(10, qty + (+b.dataset.q))); $("#qtyNow").textContent = qty;
  });
  function need() {
    if (sel) return true;
    var s = $("#sizes"); s.classList.remove("shake"); void s.offsetWidth; s.classList.add("shake");
    $("#sizeHint").textContent = "Pick a size first";
    s.scrollIntoView({ block: "center", behavior: RM ? "auto" : "smooth" });
    return false;
  }
  var mainImg = $(".gal__slide img");
  $("#addBtn").addEventListener("click", function () { if (need()) addToCart(p.id, sel, qty, mainImg); });
  $("#barBtn").addEventListener("click", function () { if (need()) addToCart(p.id, sel, qty, null); });
  $("#buyBtn").addEventListener("click", function () { if (need()) { Cart.add(p.id, sel, qty); location.hash = "#/checkout"; } });
  var g = $("#openGuide"); if (g) g.addEventListener("click", sizeGuide);
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
    var bar = $("#buybar"); if (bar) bar.classList.toggle("on", !es[0].isIntersecting && es[0].boundingClientRect.top < 0);
  }).observe($("#addBtn"));
}

function sizeGuide() {
  var G = C.sizeGuide;
  openModal("<h2>Size guide</h2><p class=\"modal__sub\">" + esc(G.note || "") + '</p><div class="table-wrap"><table class="table"><thead><tr>' +
    G.columns.map(function (c) { return "<th>" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
    G.rows.map(function (r) { return "<tr>" + r.map(function (c, i) { return (i ? "<td>" : "<td><b>") + esc(c) + (i ? "</td>" : "</b></td>"); }).join("") + "</tr>"; }).join("") +
    "</tbody></table></div>", { label: "Size guide", wide: true });
}

/* ============================================================
   ADDRESS FORM (shared by checkout and account)
   ============================================================ */
function field(name, label, attrs, val) {
  return '<label class="field" data-f="' + name + '"><span>' + label + '</span><input name="' + name + '" value="' + esc(val || "") + '" ' + (attrs || "") + "><em></em></label>";
}
function addrFields(a) {
  a = a || {};
  var country = COUNTRIES.length === 1
    ? '<label class="field" data-f="country"><span>Country</span><input name="country" value="' + esc(COUNTRIES[0]) + '" readonly tabindex="-1"><em></em></label>'
    : '<label class="field" data-f="country"><span>Country</span><select name="country" autocomplete="country-name">' + COUNTRIES.map(function (c) {
        return "<option" + (a.country === c ? " selected" : "") + ">" + esc(c) + "</option>"; }).join("") + "</select><em></em></label>";
  return '<div class="stack"><div class="grid2">' +
    field("name", "Full name", 'autocomplete="name" required', a.name) +
    field("phone", "Phone number", 'type="tel" inputmode="tel" autocomplete="tel" required', a.phone) + "</div>" +
    field("line1", "Address", 'autocomplete="address-line1" placeholder="House number and street" required', a.line1) +
    field("line2", "Apartment, landmark (optional)", 'autocomplete="address-line2"', a.line2) +
    '<div class="grid2">' + field("city", "City", 'autocomplete="address-level2" required', a.city) +
    field("state", "State", 'autocomplete="address-level1" required', a.state) + "</div>" +
    '<div class="grid2">' + field("pin", INDIA_ONLY ? "PIN code" : US_ONLY ? "ZIP code" : "PIN / ZIP code", (INDIA_ONLY ? 'inputmode="numeric" maxlength="6" ' : "") + 'autocomplete="postal-code" required', a.pin) +
    country + "</div></div>";
}
function readAddr(root) {
  var d = {}, ok = true, first = null;
  ["name", "phone", "line1", "line2", "city", "state", "pin", "country"].forEach(function (k) {
    var el = $('[name="' + k + '"]', root); d[k] = el ? el.value.trim() : "";
  });
  function bad(k, msg) {
    var f = $('[data-f="' + k + '"]', root); if (!f) return;
    f.classList.toggle("bad", !!msg); $("em", f).textContent = msg || "";
    if (msg) { ok = false; first = first || $("input,select", f); }
  }
  bad("name", d.name.length < 2 ? "Enter your full name" : "");
  var digits = d.phone.replace(/\D/g, "");
  bad("phone", (digits.length < 8 || digits.length > 15) ? "Enter a phone number we can reach you on" : "");
  bad("line1", d.line1.length < 4 ? "Enter your street address" : "");
  bad("city", d.city.length < 2 ? "Enter your city" : "");
  bad("state", d.state.length < 2 ? "Enter your state" : "");
  var india = /india/i.test(d.country);
  var usa = /united states|usa/i.test(d.country);
  bad("pin", india ? (/^\d{6}$/.test(d.pin) ? "" : "PIN code has 6 digits") : usa ? (/^\d{5}(-\d{4})?$/.test(d.pin) ? "" : "ZIP code has 5 digits") : (d.pin.length < 3 ? "Enter your postal code" : ""));
  if (first) first.focus();
  return ok ? d : null;
}
function addrText(a) {
  return [a.line1, a.line2, a.city, [a.state, a.pin].filter(Boolean).join(" "), a.country].filter(Boolean).join(", ");
}
function saveAddresses() {
  if (state.user) return Account.push().catch(function () { toast("Could not save to your account. Check your connection.", { err: true }); });
  ls.set("ocb_addr_v1", state.addresses);
  return Promise.resolve();
}
function upsertAddress(a) {
  var same = state.addresses.filter(function (x) { return x.id === a.id || (x.line1 === a.line1 && x.pin === a.pin && x.name === a.name); })[0];
  if (same) { a.id = same.id; state.addresses[state.addresses.indexOf(same)] = a; }
  else { a.id = a.id || ("a" + Date.now().toString(36)); state.addresses.unshift(a); }
  state.addresses = state.addresses.slice(0, 8);
  return saveAddresses();
}

/* ============================================================
   CHECKOUT
   ============================================================ */
var co = { addr: null, method: null, email: "" }, payDown = false;
function sumHTML(lines, sub, ship, total) {
  return lines.map(function (l) {
    return '<div class="sum__item"><img src="' + esc(l.image) + '" alt=""><div><b>' + esc(l.name) + "</b><small>" + esc(l.colour) + (l.colour ? ", " : "") + "size " + esc(l.size) + " × " + l.qty +
      "</small></div><span>" + money(l.price * l.qty) + "</span></div>";
  }).join("") + '<div class="totals"><div><span>Subtotal</span><span>' + money(sub) + "</span></div><div><span>Shipping</span><span>" + (ship ? money(ship) : "Free") +
    '</span></div><div class="grand"><span>Total</span><span>' + money(total) + "</span></div></div>";
}
function methods() {
  var m = [];
  if (F.rzp) m.push({ id: "razorpay", ic: icon("card"), t: "Pay online", s: (INR ? "UPI, cards, netbanking and wallets." : "Credit and debit cards.") + " Secured by Razorpay.", cta: function (t) { return "Pay " + money(t); } });
  if (F.wa) m.push({ id: "whatsapp", ic: icon("wa"), wa: true, t: "Order on WhatsApp", s: "Your cart opens in WhatsApp. We confirm it and share the payment details there.", cta: function () { return "Send order on WhatsApp"; } });
  if (!m.length || (payDown && !F.wa)) m.push({ id: "email", ic: icon("mail"), t: "Order by email", s: "Your order opens as an email to us. We reply with the payment details.", cta: function () { return "Send order by email"; } });
  return m;
}
function renderCheckout() {
  setTheme("light");
  document.title = "Checkout — OCB";
  if (!Cart.items.length) {
    vPage.innerHTML = '<div class="page"><div class="wrap"><div class="empty"><h1 class="page__title">Your cart is empty</h1><p>Add a piece and it will be waiting here.</p><a href="#/shop" class="btn btn--fill"><span>Shop the drop</span></a></div></div></div>';
    return;
  }
  var keep = $("#coForm") ? snapshot() : null;
  var M = methods();
  if (!co.method || !M.filter(function (m) { return m.id === co.method; }).length) co.method = M[0].id;
  var saved = state.addresses;
  if (co.addr === null) co.addr = saved.length ? saved[0].id : "new";
  if (co.addr !== "new" && !saved.filter(function (a) { return a.id === co.addr; }).length) co.addr = saved.length ? saved[0].id : "new";
  var email = co.email || (state.user && state.user.email) || ls.get("ocb_email", "");
  var signedOutNote = (F.fb && state.authReady && !state.user)
    ? '<div class="note" style="margin-bottom:22px">' + icon("user") + '<span><button id="coSignIn">Sign in</button> to use your saved addresses and keep this order in your history. Or carry on as a guest.</span></div>' : "";

  vPage.innerHTML = '<div class="page"><div class="wrap">' +
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span>/</span><span>Checkout</span></nav>' +
    '<h1 class="page__title">Checkout</h1><div class="co">' +
    '<form id="coForm" novalidate>' + signedOutNote +
      '<div class="co__block"><div class="co__h"><h2>Delivery</h2></div>' +
        (saved.length ? '<div class="addr-list" id="addrList">' + saved.map(function (a) {
          return '<label class="pick' + (co.addr === a.id ? " on" : "") + '"><input type="radio" name="addr" value="' + esc(a.id) + '"' + (co.addr === a.id ? " checked" : "") + "><span><b>" + esc(a.name) + "</b><small>" + esc(addrText(a)) + "</small><small>" + esc(a.phone) + "</small></span></label>";
        }).join("") + '<label class="pick' + (co.addr === "new" ? " on" : "") + '"><input type="radio" name="addr" value="new"' + (co.addr === "new" ? " checked" : "") + "><span><b>Use a different address</b></span></label></div>" : "") +
        '<div id="addrNew"' + (co.addr === "new" ? "" : " hidden") + ">" + addrFields() +
          '<label class="check" style="margin-top:16px"><input type="checkbox" id="saveAddr" checked><span>' + (state.user ? "Save this address to my account" : "Remember this address on this device") + "</span></label></div>" +
        '<div style="margin-top:16px">' + field("email", "Email for your receipt (optional)", 'type="email" autocomplete="email" inputmode="email"', email) + "</div>" +
      "</div>" +
      '<div class="co__block"><div class="co__h"><h2>Payment</h2></div><div class="addr-list" id="payList">' +
        M.map(function (m) {
          return '<label class="pick' + (co.method === m.id ? " on" : "") + '"><input type="radio" name="pay" value="' + m.id + '"' + (co.method === m.id ? " checked" : "") + '><span class="ic' + (m.wa ? " wa" : "") + '">' + m.ic + "</span><span><b>" + m.t + "</b><small>" + m.s + "</small></span></label>";
        }).join("") + "</div>" +
        '<p class="msg err" id="coMsg" role="alert"></p>' +
        '<button type="submit" class="btn btn--fill btn--block' + (co.method === "whatsapp" ? " btn--wa" : "") + '" id="coBtn" style="margin-top:6px"><span id="coBtnText"></span></button>' +
        '<p class="secure">' + icon("lock") + (co.method === "razorpay" ? "Payments are encrypted and processed by Razorpay" : "We never ask for card details in chat or email") + "</p>" +
      "</div></form>" +
    '<aside class="co__sum" aria-label="Order summary"><div class="co__h"><h2>Your order</h2><a class="link" href="#/shop">Edit</a></div>' +
      sumHTML(Cart.lines(), Cart.subtotal(), Cart.shipping(), Cart.total()) + "</aside></div></div></div>";

  if (keep) restore(keep);
  var cta = M.filter(function (m) { return m.id === co.method; })[0].cta(Cart.total());
  $("#coBtnText").textContent = cta;
  var form = $("#coForm");
  form.addEventListener("change", function (e) {
    if (e.target.name === "addr") { co.addr = e.target.value; renderCheckout(); }
    if (e.target.name === "pay") { co.method = e.target.value; renderCheckout(); }
  });
  $('[name="email"]', form).addEventListener("input", function (e) { co.email = e.target.value.trim(); });
  var s = $("#coSignIn"); if (s) s.addEventListener("click", function (e) { e.preventDefault(); Account.signInModal(); });
  form.addEventListener("submit", function (e) { e.preventDefault(); placeOrder(); });
}
function snapshot() { var o = {}; $$("#addrNew input, #addrNew select").forEach(function (i) { o[i.name || i.id] = i.type === "checkbox" ? i.checked : i.value; }); return o; }
function restore(o) { $$("#addrNew input, #addrNew select").forEach(function (i) { var k = i.name || i.id; if (!(k in o) || i.readOnly) return; if (i.type === "checkbox") i.checked = o[k]; else i.value = o[k]; }); }

function newRef() {
  var t = Math.floor(Date.now() / 1000).toString(36).toUpperCase();
  var r = Math.random().toString(36).slice(2, 4).toUpperCase();
  return "OCB-" + t + r;
}
function placeOrder() {
  var form = $("#coForm"), msg = $("#coMsg"), btn = $("#coBtn");
  msg.textContent = "";
  var addr;
  if (co.addr === "new") { addr = readAddr($("#addrNew")); if (!addr) { msg.textContent = "Check the highlighted fields."; return; } }
  else addr = state.addresses.filter(function (a) { return a.id === co.addr; })[0];
  var ef = $('[data-f="email"]', form), email = $('[name="email"]', form).value.trim();
  var eBad = email && !RE_EMAIL.test(email);
  ef.classList.toggle("bad", !!eBad); $("em", ef).textContent = eBad ? "That email doesn't look right" : "";
  if (eBad) { $("input", ef).focus(); return; }
  if (email) ls.set("ocb_email", email);

  var order = {
    ref: newRef(), createdAt: Date.now(), items: Cart.lines(),
    subtotal: Cart.subtotal(), shipping: Cart.shipping(), total: Cart.total(), currency: CUR.code || "INR",
    customer: { name: addr.name, phone: addr.phone, email: email },
    address: { line1: addr.line1, line2: addr.line2 || "", city: addr.city, state: addr.state, pin: addr.pin, country: addr.country },
    method: co.method, status: "sent", paymentId: ""
  };
  var wantSave = co.addr === "new" && $("#saveAddr").checked;
  var after = function () {
    if (wantSave) upsertAddress(Object.assign({}, addr));
    finalize(order);
  };

  if (co.method === "whatsapp") { window.open(waLink(orderText(order)), "_blank", "noopener"); after(); return; }
  if (co.method === "email") { location.href = "mailto:" + B.email + "?subject=" + encodeURIComponent("Order " + order.ref) + "&body=" + encodeURIComponent(orderText(order).replace(/\*/g, "")); after(); return; }

  btn.classList.add("is-busy");
  payOnline(order).then(function (res) {
    btn.classList.remove("is-busy");
    if (!res) return;
    order.status = res.verified ? "paid" : "check"; order.paymentId = res.paymentId;
    after();
  }).catch(function (err) {
    btn.classList.remove("is-busy");
    if (err && err.userMessage) { msg.textContent = err.userMessage; return; }
    /* fallback: keep the sale. Switch to the next way of ordering and tell the buyer. */
    payDown = true; co.method = F.wa ? "whatsapp" : "email";
    renderCheckout();
    var m2 = $("#coMsg"); if (m2) { m2.textContent = "Online payment isn't responding right now. Your cart and address are safe. Send the order on " + (F.wa ? "WhatsApp" : "email") + " instead and we will share a payment link."; m2.scrollIntoView({ block: "center", behavior: RM ? "auto" : "smooth" }); }
  });
}
function orderText(o) {
  var L = ["*New order · " + (B.name || "OCB") + "*", "Reference: " + o.ref, ""];
  o.items.forEach(function (i, n) {
    L.push((n + 1) + ". " + i.name + (i.colour ? " (" + i.colour + ")" : ""));
    L.push("   Size " + i.size + " × " + i.qty + " = " + money(i.price * i.qty));
  });
  L.push("", "Subtotal: " + money(o.subtotal), "Shipping: " + (o.shipping ? money(o.shipping) : "Free"), "*Total: " + money(o.total) + "*", "",
    "*Deliver to*", o.customer.name, o.customer.phone);
  if (o.customer.email) L.push(o.customer.email);
  L.push(addrText(o.address), "");
  L.push(o.paymentId ? "Paid online. Payment ID: " + o.paymentId : "Please confirm my order and share the payment details.");
  return L.join("\n");
}
function loadScript(src) {
  return new Promise(function (ok, no) {
    if ($('script[src="' + src + '"]')) return ok();
    var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s);
  });
}
/* Razorpay: the amount is calculated and signed on our Cloudflare Worker, never in the browser */
function payOnline(order) {
  var base = C.razorpay.workerUrl.replace(/\/+$/, "");
  var post = function (path, body) {
    return fetch(base + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw j; return j; }); });
  };
  return Promise.all([
    post("/create-order", { ref: order.ref, customer: order.customer, address: order.address,
      items: order.items.map(function (i) { return { id: i.id, size: i.size, qty: i.qty }; }) }),
    loadScript("https://checkout.razorpay.com/v1/checkout.js")
  ]).then(function (r) {
    var o = r[0];
    if (!o.orderId || !window.Razorpay) throw new Error("no order");
    if (o.amount !== Math.round(order.total * 100)) { var e = new Error("price"); e.userMessage = "A price was just updated. Refresh the page and check your cart again."; throw e; }
    return new Promise(function (done) {
      var rz = new window.Razorpay({
        key: C.razorpay.keyId, order_id: o.orderId, amount: o.amount, currency: o.currency,
        name: (B.name || "OCB") + " · " + (B.fullName || ""), description: "Order " + order.ref,
        image: new URL("icons/icon-192.png", location.href).href,
        prefill: { name: order.customer.name, email: order.customer.email, contact: order.customer.phone },
        notes: { ref: order.ref }, theme: { color: "#0B0B0B" },
        modal: { ondismiss: function () { done(null); } },
        handler: function (p) {
          post("/verify", p).then(function (v) { done({ paymentId: p.razorpay_payment_id, verified: !!v.ok }); })
            .catch(function () { done({ paymentId: p.razorpay_payment_id, verified: false }); });
        }
      });
      rz.on("payment.failed", function (x) { toast((x.error && x.error.description) || "The payment did not go through.", { err: true, ms: 6000 }); });
      rz.open();
    });
  });
}
function finalize(order) {
  state.orders.unshift(order); state.orders = state.orders.slice(0, 25);
  ls.set("ocb_orders_v1", state.orders);
  if (state.user) { Account.saveOrder(order); state.remoteOrders = null; }
  co = { addr: null, method: null, email: "" };
  Cart.clear();
  location.hash = "#/order/" + order.ref;
}

function findOrder(ref) {
  return state.orders.concat(state.remoteOrders || []).filter(function (o) { return o.ref === ref; })[0];
}
function renderOrder(ref) {
  setTheme("light");
  document.title = "Order " + ref + " — OCB";
  var o = findOrder(ref);
  if (!o && F.fb && (!state.authReady || (state.user && !state.remoteOrders))) {
    vPage.innerHTML = '<div class="page"><div class="wrap"><p class="label">Loading your order…</p></div></div>';
    if (state.user) Account.orders().then(function () { if (current.view === "order") renderOrder(ref); }, function () { state.remoteOrders = []; renderOrder(ref); });
    return;
  }
  if (!o) {
    vPage.innerHTML = '<div class="page"><div class="wrap"><div class="empty"><h1 class="page__title">Order not found</h1><p>This order isn\'t saved on this device.' + (F.fb ? " Sign in to see your order history." : "") +
      '</p><a href="#/shop" class="btn btn--fill"><span>Back to the shop</span></a></div></div></div>';
    return;
  }
  var head, text, actions = "";
  if (o.status === "paid") { head = "Order placed"; text = "Payment received. We are packing your order and will send the tracking details to " + esc(o.customer.phone) + (o.customer.email ? " and " + esc(o.customer.email) : "") + "."; }
  else if (o.status === "check") { head = "Payment received"; text = "Your payment went through and we are confirming it. If you don't hear from us within a few hours, message us with your order reference."; }
  else if (o.method === "whatsapp") { head = "One step left"; text = "WhatsApp opened with your order written out. Press send there and we will confirm it and share the payment details.";
    actions = '<a class="btn btn--fill btn--wa" target="_blank" rel="noopener" href="' + esc(waLink(orderText(o))) + '"><span>' + icon("wa") + " Open WhatsApp again</span></a>" +
      (B.email ? '<a class="btn" href="mailto:' + esc(B.email) + "?subject=" + encodeURIComponent("Order " + o.ref) + "&body=" + encodeURIComponent(orderText(o).replace(/\*/g, "")) + '"><span>Send by email instead</span></a>' : ""); }
  else { head = "One step left"; text = "Your email app opened with your order written out. Press send and we will reply with the payment details.";
    actions = '<a class="btn btn--fill" href="mailto:' + esc(B.email) + "?subject=" + encodeURIComponent("Order " + o.ref) + "&body=" + encodeURIComponent(orderText(o).replace(/\*/g, "")) + '"><span>Open the email again</span></a>'; }
  if (o.paymentId && F.wa) actions += '<a class="btn" target="_blank" rel="noopener" href="' + esc(waLink("Hi OCB, my order reference is " + o.ref + ".")) + '"><span>Message us</span></a>';
  vPage.innerHTML = '<div class="page"><div class="wrap"><div class="done">' +
    '<svg class="done__tick" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="21"/><path d="m14.5 24.5 6.6 6.6L34 18.2"/></svg>' +
    "<h1>" + head + "</h1><p>" + text + '</p><p class="done__ref">Reference ' + esc(o.ref) + "</p>" +
    '<div class="done__actions">' + actions + '<a class="btn" href="#/shop"><span>Keep shopping</span></a></div>' +
    '<div class="co__sum">' + sumHTML(o.items, o.subtotal, o.shipping, o.total) +
    '<div class="totals" style="margin-top:18px;padding-top:14px;border-top:1px solid var(--line)"><div><span>Deliver to</span><span style="text-align:right;max-width:70%">' + esc(o.customer.name) + "<br>" + esc(addrText(o.address)) + "</span></div>" +
    (o.paymentId ? "<div><span>Payment ID</span><span>" + esc(o.paymentId) + "</span></div>" : "") + "</div></div></div></div></div>";
}

/* ============================================================
   POLICIES
   ============================================================ */
function renderPolicy(slug) {
  setTheme("light");
  var body, title, updated = "";
  if (slug === "contact") {
    title = "Contact";
    body = "<p>We read every message and a real person replies, usually within one working day.</p><address>" +
      (B.legalName ? esc(B.legalName) + "<br>" : "") + ((B.address && B.showAddress !== false) ? esc(B.address) + "<br><br>" : "<br>") +
      (B.email ? 'Email: <a style="text-decoration:underline" href="mailto:' + esc(B.email) + '">' + esc(B.email) + "</a><br>" : "") +
      (F.wa ? 'WhatsApp: <a style="text-decoration:underline" target="_blank" rel="noopener" href="' + esc(waLink("Hi OCB")) + '">+' + esc(WA) + "</a><br>" : "") +
      (B.instagram ? 'Instagram: <a style="text-decoration:underline" target="_blank" rel="noopener" href="https://instagram.com/' + esc(B.instagram) + '">@' + esc(B.instagram) + "</a>" : "") + "</address>";
  } else {
    var pol = C.policies[slug]; title = pol.title; updated = pol.updated || "";
    body = (pol.body || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");
  }
  document.title = title + " — OCB";
  vPage.innerHTML = '<div class="page"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span>/</span><span>' + esc(title) + "</span></nav>" +
    '<h1 class="page__title">' + esc(title) + '</h1><div class="policy">' + (updated ? '<span class="label">Last updated ' + esc(updated) + "</span>" : "") + body + "</div></div></div>";
}

/* ============================================================
   ACCOUNTS (Firebase). Loads only when config.js has Firebase keys.
   ============================================================ */
var Account = (function () {
  var fb = null, loading = null;
  var VER = "10.12.2", BASE = "https://www.gstatic.com/firebasejs/" + VER + "/";
  var ERR = {
    "auth/invalid-credential": "That email and password don't match. Try again or reset your password.",
    "auth/wrong-password": "That password isn't right.",
    "auth/user-not-found": "No account uses that email. Create one instead.",
    "auth/email-already-in-use": "An account already uses that email. Sign in instead.",
    "auth/weak-password": "Use at least 6 characters for your password.",
    "auth/invalid-email": "That email doesn't look right.",
    "auth/too-many-requests": "Too many tries. Wait a few minutes and try again.",
    "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups for this site and try again.",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
    "auth/quota-exceeded": "Sign-in links are used up for today. Use Google or a password instead.",
    "auth/unauthorized-continue-uri": "This website address isn't approved in Firebase yet.",
    "auth/operation-not-allowed": "This sign-in method isn't switched on yet.",
    "auth/unauthorized-domain": "This website address isn't approved in Firebase yet."
  };
  function nice(e) { return ERR[e && e.code] || "Something went wrong. Try again."; }

  function init() {
    if (!F.fb) return Promise.resolve(null);
    if (loading) return loading;
    loading = Promise.all([import(BASE + "firebase-app.js"), import(BASE + "firebase-auth.js"), import(BASE + "firebase-firestore-lite.js")])
      .then(function (m) {
        var app = m[0].initializeApp(C.firebase);
        fb = { au: m[1], fs: m[2], auth: m[1].getAuth(app), db: m[2].getFirestore(app) };
        fb.au.onAuthStateChanged(fb.auth, onUser);
        return finishEmailLink().then(function () { return fb; });
      })
      .catch(function (e) {
        console.warn("Accounts unavailable:", e);
        state.authReady = true; F.fb = false; $("#btnAccount").hidden = true;
        return null;
      });
    return loading;
  }
  function finishEmailLink() {
    try {
      if (!fb.au.isSignInWithEmailLink(fb.auth, location.href)) return Promise.resolve();
      var email = ls.get("ocb_link_email", "") || window.prompt("Confirm your email to finish signing in");
      if (!email) return Promise.resolve();
      return fb.au.signInWithEmailLink(fb.auth, email, location.href).then(function () {
        ls.del("ocb_link_email");
        history.replaceState(null, "", location.pathname);
        location.hash = "#/account";
        toast("You're signed in");
      }).catch(function (e) { history.replaceState(null, "", location.pathname); toast(nice(e), { err: true, ms: 6000 }); });
    } catch (e) { return Promise.resolve(); }
  }
  function onUser(u) {
    state.user = u; state.authReady = true; state.remoteOrders = null;
    var b = $("#btnAccount");
    b.innerHTML = u ? '<span class="nav__avatar">' + esc((u.displayName || u.email || "?").charAt(0)) + "</span>" : icon("user");
    b.setAttribute("aria-label", u ? "Your account" : "Sign in");
    var done = function () {
      if (current.view === "account") renderAccount();
      if (current.view === "checkout") { co.addr = null; renderCheckout(); }
      if (current.view === "order") renderOrder(current.arg);
    };
    if (!u) { state.addresses = ls.get("ocb_addr_v1", []); done(); return; }
    pull().then(done, done);
  }
  function userDoc() { return fb.fs.doc(fb.db, "users", state.user.uid); }
  function pull() {
    return fb.fs.getDoc(userDoc()).then(function (s) {
      var remote = (s.exists() && s.data().addresses) || [], local = ls.get("ocb_addr_v1", []);
      if (!remote.length && local.length) { state.addresses = local; return push(); }
      state.addresses = remote;
    });
  }
  function push() {
    return fb.fs.setDoc(userDoc(), { addresses: state.addresses, email: state.user.email || "", name: state.user.displayName || "", updatedAt: Date.now() }, { merge: true });
  }
  function saveOrder(o) {
    if (!fb || !state.user) return;
    fb.fs.setDoc(fb.fs.doc(fb.db, "orders", o.ref), Object.assign({ uid: state.user.uid }, o)).catch(function (e) { console.warn(e); });
  }
  function orders() {
    if (state.remoteOrders) return Promise.resolve(state.remoteOrders);
    var q = fb.fs.query(fb.fs.collection(fb.db, "orders"), fb.fs.where("uid", "==", state.user.uid));
    return fb.fs.getDocs(q).then(function (s) {
      var a = []; s.forEach(function (d) { a.push(d.data()); });
      a.sort(function (x, y) { return y.createdAt - x.createdAt; });
      state.remoteOrders = a; return a;
    });
  }

  /* ----- sign-in dialog: shows only the methods switched on in config.js ----- */
  var GOOGLE = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>';
  function signInModal() {
    init().then(function (ok) {
      if (!ok) { toast("Accounts aren't available right now. You can still check out as a guest.", { err: true }); return; }
      var blocks = [];
      if (SI.emailLink) blocks.push('<form id="fLink" class="stack" novalidate>' + field("email", "Email", 'type="email" autocomplete="email" inputmode="email" required') +
        '<button class="btn btn--fill btn--block"><span>Email me a sign-in link</span></button><p class="msg" id="mLink" role="status">No password needed. We send a one-time link to your inbox.</p></form>');
      if (SI.google !== false) blocks.push('<button class="gbtn" id="bGoogle">' + GOOGLE + "<span>Continue with Google</span></button>");
      if (SI.emailPassword !== false) blocks.push('<form id="fPass" class="stack" novalidate>' + field("email", "Email", 'type="email" autocomplete="email" inputmode="email" required') +
        field("password", "Password", 'type="password" autocomplete="current-password" minlength="6" required') +
        '<button class="btn ' + (blocks.length ? "" : "btn--fill ") + 'btn--block"><span id="tPass">Sign in</span></button><p class="msg err" id="mPass" role="alert"></p>' +
        '<p class="auth__switch"><span id="tSwitch">New here?</span> <button type="button" id="bSwitch">Create an account</button> · <button type="button" id="bReset">Forgot password</button></p></form>');
      var p = openModal("<h2>Sign in</h2><p class=\"modal__sub\">Save your addresses and keep your orders in one place.</p>" + blocks.join('<div class="or">or</div>'), { label: "Sign in" });
      var ok2 = function () { closeModal(); toast("You're signed in"); };

      var fl = $("#fLink", p);
      if (fl) fl.addEventListener("submit", function (e) {
        e.preventDefault();
        var em = $("input", fl).value.trim(), m = $("#mLink", p), b = $("button", fl);
        if (!RE_EMAIL.test(em)) { m.className = "msg err"; m.textContent = "Enter a valid email address"; return; }
        b.classList.add("is-busy");
        fb.au.sendSignInLinkToEmail(fb.auth, em, { url: location.origin + location.pathname, handleCodeInApp: true }).then(function () {
          ls.set("ocb_link_email", em); b.classList.remove("is-busy");
          m.className = "msg ok"; m.textContent = "Link sent to " + em + ". Open it on this device to sign in.";
        }).catch(function (x) { b.classList.remove("is-busy"); m.className = "msg err"; m.textContent = nice(x); });
      });

      var bg = $("#bGoogle", p);
      if (bg) bg.addEventListener("click", function () {
        fb.au.signInWithPopup(fb.auth, new fb.au.GoogleAuthProvider()).then(ok2).catch(function (x) {
          if (x && (x.code === "auth/popup-closed-by-user" || x.code === "auth/cancelled-popup-request")) return;
          toast(nice(x), { err: true, ms: 6000 });
        });
      });

      var fp = $("#fPass", p), creating = false;
      if (fp) {
        $("#bSwitch", p).addEventListener("click", function () {
          creating = !creating;
          $("#tPass", p).textContent = creating ? "Create account" : "Sign in";
          $("#tSwitch", p).textContent = creating ? "Have an account?" : "New here?";
          this.textContent = creating ? "Sign in" : "Create an account";
          $('[name="password"]', fp).setAttribute("autocomplete", creating ? "new-password" : "current-password");
        });
        $("#bReset", p).addEventListener("click", function () {
          var em = $('[name="email"]', fp).value.trim(), m = $("#mPass", p);
          if (!RE_EMAIL.test(em)) { m.className = "msg err"; m.textContent = "Type your email above first, then press Forgot password."; return; }
          fb.au.sendPasswordResetEmail(fb.auth, em).then(function () { m.className = "msg ok"; m.textContent = "Reset link sent to " + em + "."; })
            .catch(function (x) { m.className = "msg err"; m.textContent = nice(x); });
        });
        fp.addEventListener("submit", function (e) {
          e.preventDefault();
          var em = $('[name="email"]', fp).value.trim(), pw = $('[name="password"]', fp).value, m = $("#mPass", p), b = $("button.btn", fp);
          m.className = "msg err";
          if (!RE_EMAIL.test(em)) { m.textContent = "Enter a valid email address"; return; }
          if (pw.length < 6) { m.textContent = "Use at least 6 characters for your password."; return; }
          b.classList.add("is-busy"); m.textContent = "";
          (creating ? fb.au.createUserWithEmailAndPassword(fb.auth, em, pw) : fb.au.signInWithEmailAndPassword(fb.auth, em, pw))
            .then(ok2).catch(function (x) { b.classList.remove("is-busy"); m.textContent = nice(x); });
        });
      }
    });
  }
  function signOut() { if (fb) fb.au.signOut(fb.auth).then(function () { toast("Signed out"); }); }

  return { init: init, signInModal: signInModal, signOut: signOut, push: push, saveOrder: saveOrder, orders: orders };
})();

function renderAccount() {
  setTheme("light");
  document.title = "Account — OCB";
  var shell = function (inner) { vPage.innerHTML = '<div class="page"><div class="wrap"><nav class="crumbs" aria-label="Breadcrumb"><a href="#/">Home</a><span>/</span><span>Account</span></nav><h1 class="page__title">Account</h1>' + inner + "</div></div>"; };
  if (!state.authReady) { shell('<p class="label">Loading…</p>'); return; }
  if (!state.user) {
    shell('<div class="empty" style="text-align:left;padding:0"><p style="margin-left:0">Sign in to save your addresses and see your orders.</p><button class="btn btn--fill" id="acctIn"><span>Sign in or create account</span></button></div>');
    $("#acctIn").addEventListener("click", Account.signInModal);
    return;
  }
  var u = state.user;
  shell('<div class="acct"><div class="acct__me"><span class="nav__avatar">' + esc((u.displayName || u.email || "?").charAt(0)) + "</span><b>" + esc(u.displayName || "Welcome") +
    "</b><small>" + esc(u.email || "") + '</small><button class="btn btn--sm" id="acctOut"><span>Sign out</span></button></div>' +
    '<div><div class="co__block"><div class="co__h"><h2>Addresses</h2><button class="link" id="addrAdd">Add address</button></div><div class="stack" id="addrCards"></div></div>' +
    '<div class="co__block"><div class="co__h"><h2>Orders</h2></div><div class="stack" id="orderCards"><p class="label">Loading…</p></div></div></div></div>');
  $("#acctOut").addEventListener("click", Account.signOut);
  $("#addrAdd").addEventListener("click", function () { addressModal(); });
  paintAddrCards();
  Account.orders().then(function (list) {
    var el = $("#orderCards"); if (!el) return;
    el.innerHTML = list.length ? list.map(function (o) {
      return '<a class="card" href="#/order/' + esc(o.ref) + '"><span><b>' + esc(o.ref) + "</b>" +
        '<span class="tag' + (o.status === "paid" ? " tag--paid" : "") + '">' + (o.status === "paid" ? "Paid" : o.status === "check" ? "Confirming" : "Sent") + "</span>" +
        "<small>" + new Date(o.createdAt).toLocaleDateString(CUR.locale || "en-IN", { day: "numeric", month: "short", year: "numeric" }) + ", " +
        o.items.map(function (i) { return esc(i.name) + " × " + i.qty; }).join(", ") + "</small></span><b>" + money(o.total) + "</b></a>";
    }).join("") : '<p style="color:var(--fg-dim)">No orders yet. <a href="#/shop" style="text-decoration:underline">Shop the drop</a>.</p>';
  }).catch(function () { var el = $("#orderCards"); if (el) el.innerHTML = '<p style="color:var(--fg-dim)">Could not load your orders. Check your connection and reopen this page.</p>'; });
}
function paintAddrCards() {
  var el = $("#addrCards"); if (!el) return;
  el.innerHTML = state.addresses.length ? state.addresses.map(function (a) {
    return '<div class="card"><span><b>' + esc(a.name) + "</b><small>" + esc(addrText(a)) + "</small><small>" + esc(a.phone) + '</small></span><span class="card__acts"><button class="link" data-edit="' + esc(a.id) + '">Edit</button><button class="link" data-del="' + esc(a.id) + '">Delete</button></span></div>';
  }).join("") : '<p style="color:var(--fg-dim)">No saved addresses yet.</p>';
  el.onclick = function (e) {
    var ed = e.target.closest("[data-edit]"), del = e.target.closest("[data-del]");
    if (ed) addressModal(state.addresses.filter(function (a) { return a.id === ed.dataset.edit; })[0]);
    if (del) { state.addresses = state.addresses.filter(function (a) { return a.id !== del.dataset.del; }); saveAddresses().then(function () { toast("Address deleted"); }); paintAddrCards(); }
  };
}
function addressModal(a) {
  var p = openModal("<h2>" + (a ? "Edit address" : "Add address") + '</h2><form id="fAddr" novalidate style="margin-top:18px">' + addrFields(a) +
    '<button class="btn btn--fill btn--block" style="margin-top:20px"><span>Save address</span></button></form>', { label: "Address", wide: true });
  $("#fAddr", p).addEventListener("submit", function (e) {
    e.preventDefault();
    var d = readAddr(p); if (!d) return;
    if (a) d.id = a.id;
    upsertAddress(d).then(function () { toast("Address saved"); });
    closeModal(); paintAddrCards();
  });
}
$("#btnAccount").addEventListener("click", function () { if (state.user) location.hash = "#/account"; else Account.signInModal(); });

/* ============================================================
   ADD TO HOME SCREEN
   ============================================================ */
var Install = (function () {
  var deferred = null, IP = C.installPrompt || {};
  var ua = navigator.userAgent;
  var standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  var iOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var android = /Android/i.test(ua);
  var ff = /Firefox|FxiOS/i.test(ua), samsung = /SamsungBrowser/i.test(ua);
  var iosOther = iOS && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  var macSafari = !iOS && /Safari/i.test(ua) && !/Chrome|Chromium|Edg|OPR|Android/i.test(ua);
  var chromium = !iOS && /Chrome|Chromium|Edg/i.test(ua);

  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener("appinstalled", function () { deferred = null; ls.set("ocb_install", { done: 1 }); closeModal(); toast("OCB is on your home screen"); });

  function kind() {
    if (deferred) return "prompt";
    if (iOS) return "ios";
    if (android) return ff ? "android-ff" : samsung ? "android-samsung" : "android";
    if (macSafari) return "mac";
    if (chromium) return "desktop";
    return "none";
  }
  function step(title, sub, glyph) { return "<li><span><b>" + title + "</b>" + (sub ? "<small>" + sub + "</small>" : "") + '</span><span class="glyph">' + icon(glyph, "icon") + "</span></li>"; }
  var STEPS = {
    ios: function () { return step("Tap the Share button", iosOther ? "At the top right, next to the address" : "In the bar at the bottom of Safari", "share") +
      step("Choose “Add to Home Screen”", "Scroll down the list to find it", "plus") + step("Tap “Add”", "OCB appears beside your other apps", "check"); },
    android: function () { return step("Tap the three dots", "At the top right of Chrome", "dots") + step("Tap “Add to Home screen”", "It may say “Install app”", "install") + step("Tap “Install”", "OCB appears beside your other apps", "check"); },
    "android-ff": function () { return step("Tap the three dots", "Beside the address bar", "dots") + step("Tap “Add app to Home screen”", "", "install") + step("Tap “Add”", "OCB appears beside your other apps", "check"); },
    "android-samsung": function () { return step("Tap the menu", "Three lines at the bottom right", "menu") + step("Tap “Add page to”, then “Home screen”", "", "plus") + step("Tap “Add”", "OCB appears beside your other apps", "check"); },
    desktop: function () { return step("Find the install icon", "At the right end of the address bar", "desktop") + step("Click “Install”", "OCB opens in its own window", "check"); },
    mac: function () { return step("Click the Share button", "In the Safari toolbar, or open the File menu", "share") + step("Choose “Add to Dock”", "", "plus") + step("Click “Add”", "OCB appears in your Dock", "check"); }
  };
  function open(manual) {
    var k = kind();
    var head = '<div class="install__app"><img src="icons/icon-192.png" alt=""><div><h2 style="margin:0;padding:0">Get the OCB app</h2><small>Opens full screen, straight from your home screen</small></div></div>';
    var later = function () { ls.set("ocb_install", { later: Date.now() }); };
    if (k === "none") {
      if (!manual) return;
      openModal(head + '<p class="modal__sub">This browser can\'t add web apps. Open ' + esc((B.siteUrl || location.origin).replace(/^https?:\/\//, "")) + " in Chrome, Edge or Safari, or on your phone, and try again.</p>", { label: "Get the app" });
      return;
    }
    var body = k === "prompt"
      ? '<p class="modal__sub">One tap. No app store, no download size to worry about, and new drops reach you first.</p><button class="btn btn--fill btn--block" id="doInstall"><span>' + icon("install") + ' Add to home screen</span></button>'
      : '<p class="modal__sub">No app store needed. Here is how:</p><ol class="steps">' + STEPS[k]() + "</ol>";
    var p = openModal(head + body + '<button class="btn btn--block" data-x style="margin-top:10px"><span>Not now</span></button>', { label: "Get the app", onClose: later });
    var b = $("#doInstall", p);
    if (b) b.addEventListener("click", function () {
      var d = deferred; if (!d) return;
      d.prompt();
      (d.userChoice || Promise.resolve({})).then(function (c) { deferred = null; if (c && c.outcome === "accepted") ls.set("ocb_install", { done: 1 }); closeModal(); });
    });
  }
  function auto() {
    if (standalone || IP.enabled === false) return;
    var s = ls.get("ocb_install", {});
    if (s.done) return;
    if (s.later && Date.now() - s.later < (IP.remindAfterDays || 14) * 864e5) return;
    setTimeout(function tryShow() {
      var k = kind();
      if (k === "none" || k === "desktop" || k === "mac") return;          /* only interrupt when one tap, or a phone */
      if (anyOpen() || current.view === "checkout" || current.view === "order") { setTimeout(tryShow, 15000); return; }
      open(false);
    }, Math.max(5, IP.delaySeconds || 25) * 1000);
  }
  return { open: open, auto: auto, standalone: standalone };
})();

/* ============================================================
   HEADER BEHAVIOUR, CURSOR, MAGNETIC BUTTONS
   ============================================================ */
(function () {
  var last = 0, head = $("#head"), strip = $("#strip");
  window.addEventListener("scroll", raf(function () {
    var y = window.pageYOffset;
    strip.classList.toggle("gone", y > 40);
    if (!anyOpen()) head.classList.toggle("hide", y > 500 && y > last + 4 ? true : (y < last - 4 ? false : head.classList.contains("hide")));
    last = y;
  }), { passive: true });
  /* highlight the menu link for the section on screen */
  if ("IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (es) {
      if (current.view !== "home") return;
      es.forEach(function (e) { if (e.isIntersecting) spy(e.target.id); });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["top", "shop", "idea", "about", "help", "contact"].forEach(function (id) { var el = document.getElementById(id); if (el) so.observe(el); });
  }
})();
var ring = $(".cursor"), dot = $(".cursor-dot"), fine = !RM && window.matchMedia("(hover:hover) and (pointer:fine)").matches;
function bindHover() {
  if (!fine) return;
  $$("a,button,.chip,input,select,label.pick").forEach(function (el) {
    if (el._h) return; el._h = 1;
    var view = el.getAttribute("data-cursor") === "view";
    el.addEventListener("mouseenter", function () { ring.classList.add(view ? "view" : "grow"); });
    el.addEventListener("mouseleave", function () { ring.classList.remove("view", "grow"); });
  });
  $$("[data-magnet]").forEach(function (el) {
    if (el._m) return; el._m = 1;
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * 0.2).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + "px)";
    });
    el.addEventListener("mouseleave", function () { el.style.transform = ""; });
  });
}
if (fine) {
  var rx = 0, ry = 0, tx = 0, ty = 0, seen = false;
  window.addEventListener("mousemove", function (e) {
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
    if (!seen) { seen = true; rx = tx; ry = ty; ring.classList.add("on"); dot.classList.add("on"); }
  }, { passive: true });
  document.addEventListener("mouseleave", function () { ring.classList.remove("on"); dot.classList.remove("on"); seen = false; });
  (function loop() {
    rx += (tx - rx) * 0.18; ry += (ty - ry) * 0.18;
    ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px) translate(-50%,-50%)";
    requestAnimationFrame(loop);
  })();
  new MutationObserver(raf(bindHover)).observe(document.body, { childList: true, subtree: true });
}

/* ============================================================
   START
   ============================================================ */
buildHome();
Cart.paint();
route(true);
bindHover();

(function boot() {
  var loader = $("#loader"), bar = $("#loaderBar");
  $("#loaderMark").innerHTML = markSVG(); setLen($("#loaderMark"));
  var quick = RM || sessionStorage.getItem("ocb_seen");
  try { sessionStorage.setItem("ocb_seen", "1"); } catch (e) {}
  var t0 = Date.now(), min = quick ? 150 : 1500, p = 0;
  var tick = setInterval(function () { p = Math.min(0.92, p + 0.07); bar.style.transform = "scaleX(" + p + ")"; }, 110);
  var fired = false;
  function done() {
    if (fired) return; fired = true;
    setTimeout(function () {
      clearInterval(tick); bar.style.transform = "scaleX(1)";
      loader.classList.add("done"); document.body.classList.add("ready");
      setTimeout(function () { loader.remove(); }, 1200);
    }, Math.max(0, min - (Date.now() - t0)));
  }
  var fonts = (document.fonts && document.fonts.ready) || Promise.resolve();
  fonts.then(done); setTimeout(done, 2600);
})();

if (F.fb) { $("#btnAccount").hidden = false; setTimeout(function () { Account.init(); }, 400); }
Install.auto();
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
}

})();

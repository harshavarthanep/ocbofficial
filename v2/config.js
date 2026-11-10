/* ==========================================================================
   OCB STORE SETTINGS
   --------------------------------------------------------------------------
   This is the only file you need to edit to run the store.
   Change a value, save, upload to GitHub, refresh the site.

   Three rules so nothing breaks:
     1. Keep text inside "quotes".
     2. Keep the comma at the end of each line.
     3. Numbers (prices, quantities) have no quotes and no currency sign.

   Anything left as "" (empty quotes) simply stays hidden on the website.
   Lines marked  <-- CHANGE  are placeholders I could not know. Replace them.
   ========================================================================== */

window.OCB_CONFIG = {

  /* ---------- 1. BRAND ---------------------------------------------------- */
  brand: {
    name: "OCB",
    fullName: "Original Clothing Brand",
    siteUrl: "https://ocbofficial.com",
    email: "info@ocbofficial.com",
    instagram: "ocb_official",          // without the @
    whatsapp: "918524861804",           // country code + number, digits only, no + or spaces. "" hides WhatsApp everywhere
    legalName: "OCB (Original Clothing Brand)",   // business name shown on the Contact page
    address: "No. 12, Sample Street, T. Nagar, Chennai, Tamil Nadu 600017, India",   // <-- CHANGE  this is a DUMMY address
    showAddress: true                   // false = hide the address (online-only business). Razorpay usually asks for one while approving you.
  },

  /* ---------- 2. THIN STRIP AT THE VERY TOP ------------------------------- */
  /* One or more short messages. They rotate. Use [] to hide the strip.       */
  announcement: [
    "Drop 001 is live",
    "Free shipping across the USA"      // <-- CHANGE if shipping is not free
  ],

  /* ---------- 3. MONEY ---------------------------------------------------- */
  currency: {
    code: "USD",                        // "USD" or "INR" (Razorpay must have this currency enabled)
    symbol: "$",                        // "$" or "₹"
    locale: "en-US",                    // "en-US" writes 100,000. "en-IN" writes 1,00,000
    taxNote: ""                         // small text beside prices, e.g. "Taxes included". "" hides it
  },
  shipping: {
    flatRate: 0,                        // shipping charge per order. 0 = free shipping
    freeAbove: 0,                       // order value where shipping becomes free. 0 = not used
    note: "Dispatched within a week",   // shown on product pages
    countries: ["United States"]        // where you deliver. Add more, e.g. ["United States", "Canada", "India"]
  },

  /* ---------- 4. PRODUCTS -------------------------------------------------
     To add a product: copy one whole block from { to }, paste it after the
     last one (with a comma between blocks) and change the values.
     To add photos: upload them to  images/products/  and add their paths to
     "images". The first image is the main one. Best shape is 4:5 portrait
     (for example 1500 x 1875 px), under 400 KB each.
     theme: "light" gives the product a cream page, "dark" gives it a black page.
     ----------------------------------------------------------------------- */
  products: [
    {
      id: "the-other-side",             // used in the link. lowercase, no spaces. Never change after launch.
      name: "The Other Side",
      colour: "Off-white",
      theme: "light",
      badge: "Drop 001",
      price: 35,                        // <-- CHANGE  price in dollars
      compareAt: 0,                     // old price shown struck through. 0 = hidden
      tagline: "You know one side. But not the other.",
      description: "Two faces, back to back, split by a single line. One you show. One you keep. The print sits on the back, so it is the last thing anyone sees of you.",
      sizes: ["S", "M", "L", "XL", "XXL"],
      soldOutSizes: [],                 // e.g. ["S", "XXL"]
      background: "#BEBAB1",            // colour behind the photo. Match your photo's backdrop.
      images: [
        "images/products/the-other-side-1.jpg",
        "images/products/the-other-side-2.jpg",
        "images/products/the-other-side-3.jpg"
      ],
      details: [                        // edit, add or remove lines freely
        "100% cotton",
        "Regular unisex fit",
        "Print on the back"
      ],
      care: [
        "Machine wash cold, inside out",
        "Do not iron on the print",
        "Dry in shade"
      ]
    },
    {
      id: "inner-noise",
      name: "Inner Noise",
      colour: "Black",
      theme: "dark",
      badge: "Drop 001",
      price: 35,                        // <-- CHANGE  price in dollars
      compareAt: 0,
      tagline: "Quiet outside / chaos within.",
      description: "A head drawn in fractures. Overthinking, expectations, memories, all of it mapped and labelled. Calm from the front. The noise stays on your back.",
      sizes: ["S", "M", "L", "XL", "XXL"],
      soldOutSizes: [],
      background: "#484846",
      images: [
        "images/products/inner-noise-1.jpg",
        "images/products/inner-noise-2.jpg",
        "images/products/inner-noise-3.jpg"
      ],
      details: [                        // edit, add or remove lines freely
        "100% cotton",
        "Regular unisex fit",
        "Print on the back"
      ],
      care: [
        "Machine wash cold, inside out",
        "Do not iron on the print",
        "Dry in shade"
      ]
    }
  ],

  /* ---------- 5. SIZE GUIDE ----------------------------------------------- */
  /* Standard unisex tee measurements. Replace with your own when you have them. */
  sizeGuide: {
    note: "Garment measured flat, in inches. Between sizes? Take the larger one.",
    columns: ["Size", "Chest", "Length", "Shoulder"],
    rows: [
      ["S",   "36", "28", "17"],
      ["M",   "40", "29", "18.5"],
      ["L",   "44", "30", "20"],
      ["XL",  "48", "31", "21.5"],
      ["XXL", "52", "32", "23"]
    ]
  },

  /* ---------- 6. HOME PAGE TEXT ------------------------------------------- */
  hero: {
    videos: ["media/headervideo1.mp4", "media/headervideo2.mp4"],   // plays one after another. [] = still image only
    poster: "media/hero-poster.jpg",    // shown while the video loads
    blackAndWhite: true,                // false = video plays in full colour
    lines: ["Some things", "aren't said.", "They're worn."],
    sub: "Drop 001 is here. Two pieces, printed on the back.",
    button: "Shop the drop"
  },
  marquee: ["Silent expression", "Drop 001", "Worn, not said", "Original Clothing Brand", "Two pieces", "Quiet outside"],

  shop: {
    title: ["Drop", "001"],
    intro: "Two pieces. One light, one dark. Pick the side you wear."
  },

  closer: {
    title: ["Look", "closer"],
    intro: "The prints, up close."
  },

  philosophy: {
    title: ["Silent", "Expression"],
    paragraphs: [
      "Not everything needs an explanation.",
      "What you wear says something before you speak. What you leave off says just as much.",
      "OCB isn't built for people chasing attention. It's built for people who already have presence, and don't need to raise their voice to prove it.",
      "We make clothing for what you don't say out loud."
    ]
  },

  /* Four short facts under the shop. <-- CHANGE to match your real policies. */
  promises: [
    { title: "Shipping",  text: "Free across the USA. Dispatched within a week." },
    { title: "Returns",   text: "14 days to exchange or return unworn pieces." },
    { title: "Payment",   text: "Pay securely by card, or order on WhatsApp." },
    { title: "Support",   text: "A real person replies on WhatsApp and email." }
  ],

  about: {
    paragraphs: [
      "OCB was built around a simple idea: clothing can say something without saying everything.",
      "We create considered pieces for people who value presence over attention. Garments shaped by restraint, detail and intention.",
      "No unnecessary noise. No chasing what's next.",
      "Just clothing with something behind it. This is the beginning."
    ]
  },

  /* Questions and answers. <-- CHANGE the answers to your real terms. */
  faq: [
    { q: "How long does delivery take?",
      a: "Orders are dispatched within a week. Delivery time after that depends on your location and the carrier. You get the tracking link on WhatsApp or email as soon as it ships." },
    { q: "Can I return or exchange?",
      a: "Yes. Unworn, unwashed pieces with tags can be exchanged or returned within 14 days of delivery. Message us with your order reference and we will arrange it." },
    { q: "How do I pick my size?",
      a: "Open the size guide on any product page and compare it with a tee you already own." },
    { q: "How do I pay?",
      a: "Pay securely by card at checkout. You can also send your order on WhatsApp and pay through the link we share." },
    { q: "Do I need an account?",
      a: "No. You can check out as a guest. An account simply saves your addresses and keeps your order history in one place." }
  ],

  newsletter: {
    title: "Enter OCB",
    sub: "Hear about the next drop before anyone else. One email when it matters.",
    /* Your existing Google Apps Script link that saves emails to your Sheet. "" hides the form. */
    endpoint: "https://script.google.com/macros/s/AKfycbxatZWjO3nD2ymn-aOhuKgQpsnm7Rgkvz1PsM3m73omiWGZVFn3hmBa4MFz-xoD1xCztQ/exec"
  },

  /* ---------- 7. PAYMENTS -------------------------------------------------
     WhatsApp ordering turns on by itself once brand.whatsapp (section 1) has
     a number. Razorpay turns on once BOTH lines below are filled.
     See the setup guide, part "Razorpay".
     ----------------------------------------------------------------------- */
  razorpay: {
    keyId: "",                          // starts with rzp_live_ (or rzp_test_ while testing). Never put the Key SECRET here.
    workerUrl: ""                       // your Cloudflare Worker link, e.g. "https://ocb-pay.yourname.workers.dev"
  },

  /* ---------- 8. ACCOUNTS (Firebase) --------------------------------------
     Paste the values Firebase gives you. While apiKey is "" the account
     button and sign-in are hidden and the shop still works for guests.
     These Firebase values are safe to be public. They are identifiers, not passwords.
     ----------------------------------------------------------------------- */
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  },
  signIn: {
    emailLink: false,                   // one-tap link sent to the inbox, no password. Free plan allows only 5 a day, so keep false until you upgrade Firebase to Blaze.
    google: true,                       // "Continue with Google"
    emailPassword: true                 // classic email + password
  },

  /* ---------- 9. "ADD TO HOME SCREEN" POP-UP ------------------------------ */
  installPrompt: {
    enabled: true,
    delaySeconds: 25,                   // how long a visitor browses before it appears
    remindAfterDays: 14                 // if they close it, wait this many days before showing again
  },

  /* ---------- 10. POLICIES ------------------------------------------------
     Razorpay checks that these pages exist before approving your account.
     <-- CHANGE: read every line and make it true for your business.
     ----------------------------------------------------------------------- */
  policies: {
    shipping: {
      title: "Shipping",
      updated: "November 2026",
      body: [
        "We deliver to addresses in the United States. Orders are processed and dispatched within 7 days of payment.",
        "Once your order ships we send the tracking details to the phone number or email you gave at checkout. Delivery time after dispatch depends on your location and the carrier.",
        "Shipping charges, if any, are shown at checkout before you pay. Any customs duties or import taxes charged at delivery are the responsibility of the recipient.",
        "Please check your address carefully. If a parcel comes back to us because the address was wrong or delivery was refused, we will contact you to arrange delivery again and a re-shipping charge may apply.",
        "If your tracking has not moved for 10 days, or the parcel is marked delivered and you do not have it, contact us and we will work with the carrier to resolve it."
      ]
    },
    returns: {
      title: "Returns and refunds",
      updated: "November 2026",
      body: [
        "You can return or exchange an item within 14 days of delivery if it is unworn, unwashed and has its original tags and packaging.",
        "To start a return, message us on WhatsApp or email with your order reference and the reason. We will reply with the return steps. Please do not send items back before contacting us.",
        "If your item arrived damaged, faulty or different from what you ordered, tell us within 7 days of delivery with a photo. We will replace it or refund you in full, including shipping, at no cost to you.",
        "For other returns the cost of return shipping is paid by the customer, and original shipping charges are not refunded.",
        "Approved refunds are issued to the original payment method within 5 to 10 business days after we receive and inspect the item. Your bank may take a few more days to show it.",
        "You can cancel an order for a full refund any time before it is dispatched."
      ]
    },
    privacy: {
      title: "Privacy",
      updated: "November 2026",
      body: [
        "This policy explains what information OCB (Original Clothing Brand) collects when you use this website and how we use it.",
        "What we collect: your name, phone number, email address and delivery address when you place an order or create an account, and your email address if you join our mailing list.",
        "How we use it: to process, deliver and support your order, to answer your questions, and, only if you signed up, to tell you about new releases. You can unsubscribe at any time.",
        "Accounts: sign-in is handled by Google Firebase. Your saved addresses and order history are stored there so you can use them again. Your cart and, if you choose, your address are also kept in your own browser.",
        "Payments: online payments are processed by Razorpay. We never see or store your card or bank details.",
        "Sharing: we do not sell or rent your information. We share it only with the service providers needed to run the store, such as the payment processor and the delivery carrier, or when the law requires it.",
        "Your choices: you can ask to see, correct or delete your information at any time by emailing us, and we will respond within 30 days.",
        "This website is not intended for children under 13 and we do not knowingly collect their information. We may update this policy and will post the new date at the top of this page."
      ]
    },
    terms: {
      title: "Terms of service",
      updated: "November 2026",
      body: [
        "This website is operated by OCB (Original Clothing Brand). By using the site or placing an order you agree to these terms.",
        "Products and prices: prices are shown in US dollars. We may change prices or withdraw products at any time, but never for an order you have already paid for. We try to show colors and prints accurately; small differences between screens and the real garment are normal.",
        "Orders: an order is confirmed once payment is received. We may refuse or cancel an order, for example if an item is unavailable or a price was listed in error, and we will refund you in full if we do.",
        "Accounts: you are responsible for keeping your sign-in details private and for activity on your account.",
        "Intellectual property: all designs, artwork, photographs, logos and text on this site belong to OCB and may not be copied or used without written permission.",
        "Liability: to the extent permitted by law, our liability for any claim relating to an order is limited to the amount you paid for that order.",
        "Changes and contact: we may update these terms and the current version is always on this page. Questions can be sent through the Contact page."
      ]
    }
  }

};

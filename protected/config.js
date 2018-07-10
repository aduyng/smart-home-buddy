exports.PORT = process.env.PORT || 5000;
exports.GOOGLE_CLIENT_ID = "<google oauth2 client id>";
exports.GOOGLE_CLIENT_SECRET = "<google oauth2 client secret>";
exports.FIREBASE_DEPLOYED_REGION = process.env.FUNCTION_REGION || "us-central1";
exports.FIREBASE_PROJECT_ID = process.env.GCP_PROJECT || "<projectId>";
exports.FIREBASE_DATABASE_URL = `https://${exports.FIREBASE_PROJECT_ID}.firebaseio.com`;
exports.GOOGLE_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/plus.login", "https://www.googleapis.com/auth/plus.me"];
exports.FIREBASE_CLOUD_FUNCTION_BASE_URL = process.env.NODE_ENV === "production" ?
  `https://${exports.FIREBASE_DEPLOYED_REGION}-${exports.FIREBASE_PROJECT_ID}.cloudfunctions.net` :
  `https://<ngrok host if you want to test locally>/${exports.FIREBASE_PROJECT_ID}/${exports.FIREBASE_DEPLOYED_REGION}`;
exports.LOG_LEVEL = "debug";

/* list of recipient names */
exports.RECIPIENT_REGEXES = [
  /(duy.*?nguyen).*?(3431.*?mayhill.*?76014)/i,
  /(binh.*?nguyen).*?(3431.*?mayhill.*?76014)/i,
];
exports.USPS_INFORMED_DELIVERY_SENDER_EMAIL = "USPSInformedDelivery@usps.gov";
exports.USPS_INFORMED_DELIVERY_SUBJECT = "Informed Delivery Daily Digest";
exports.INFORMED_DELIVERY_MAX_NUMBER_OF_CHECKING_THREADS = 5;
exports.ACTIONS_CLIENT_ID = "<action client id taken during account linking step>";

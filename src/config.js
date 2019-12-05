const IS_PROD = process.env.NODE_ENV === "production";

export default {
  API_URL: IS_PROD ? "https://api.armore.khadimfall.com" : "http://localhost",
};
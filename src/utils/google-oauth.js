import { OAuth2Client } from "google-auth-library";
import config from "../config/index.js";

export const google_oauth_client = new OAuth2Client({
  clientId: config.google_oauth_client_id,
  clientSecret: config.google_oauth_client_secret,
  redirectUri: config.google_oauth_redirect_uri,
});

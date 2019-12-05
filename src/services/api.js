import axios from 'axios';
import config from '../config';

export default {
  client: axios.create({
    baseURL: config.API_URL,
    timeout: 15000
  }),

  assamble(code) {
    return this.client.post("/assambler/assamble", { data: code });
  },

  link(buffer) {
    return this.client.post("/assambler/link", { data: buffer });
  },

  exec(buffer) {
    return this.client.post("/exec", { data: buffer });
  }
};
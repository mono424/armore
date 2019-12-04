import axios from 'axios';

export default {

  client: axios.create({
    baseURL: 'http://localhost:80',
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

}
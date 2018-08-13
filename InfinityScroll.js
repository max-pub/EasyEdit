window.customElements.define('infinity-scroll', class extends HTMLElement {
            constructor() {
                super();
                this.attachShadow({ mode: 'open' }).innerHTML = `<div id='space0'></div><table></table><div id='space1'></div`;
            }

            $(q) { return this.shadowRoot.querySelector(q); }


            connectedCallback() {
                this.S0 = this.$('#space0');
                this.S1 = this.$('#space1');
                this.LIST = this.$('tbody');
            }
        }
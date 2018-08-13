

class EasyEdit {

    constructor(node) {
        if (typeof node == 'string') node = document.querySelector(node);
        this.node = node;
        node.classList.add('EasyEdit');

        window.addEventListener('keydown', e => this.handleKeys(e));
        document.addEventListener("selectionchange", () => this.handleSelection());
        node.addEventListener('click', e => this.handleClick(e));
        node.addEventListener("paste", e => {
            console.log('paste', e);
            this.paste(e.clipboardData.getData("text/plain"));
        });

        // this.VIS = [0, 0];
        node.addEventListener("scroll", () => this.scrollHandler());

        this.STRING = {
            decode: s => s.replace(/\u00a0/g, " "),
            encode: s => s.replace(/\s/g, '&nbsp;')
        }

        this.HTML = {
            cursor: () => `<cursor></cursor>`,
            char: (c = '') => `<s>${this.STRING.encode(c)}</s>`,
            multipleChars: (s = '') => s.split('').map(c => this.HTML.char(c)).join(''),
            line: (s = '') => `<div>${this.HTML.multipleChars(s)}</div>`,
            fullLine: (i, s = '') => `<tr id='L${i}'><td>${i}</td><td>${this.HTML.line(s)}</td></tr>`,
            multipleLines: (s = '') => s.split("\n").map(line => this.HTML.fullLine(line)).join("\n"),
        }
        this.initialContent();
        // setInterval(() => this.removeInvisibleLines(), 2000);
    }
    reset() {
        this.node.innerHTML = `<div id='space0'></div><table>${this.HTML.fullLine()}</table><div id='space1'></div`;
        this.line(1).cursor();
        this.S0 = document.querySelector('#space0');
        this.S1 = document.querySelector('#space1');
        this.TBL = document.querySelector('tbody');

    }
    load(f) {
        this.reset();
        // fetch(f).then(x => x.text()).then(x => this.paste(x));
        fetch(f).then(x => x.text()).then(x => {
            this.doc = x.split("\n");
            for (var i = 0; i < 20; i++)
                this.insertBelow();
            // this.render(20);
            this.node.scrollTop = this.node.querySelector('table').offsetTop;
        });
        return this;
    }
    isVisible(node, parentOffset = 0) {
        // console.log('isVisible',node);
        var E0 = this.node.scrollTop;
        var E1 = E0 + this.node.offsetHeight;
        // console.log('editor',E0,E1);

        // var node = document.querySelector(id);
        var N0 = node.offsetTop + parentOffset;
        var N1 = N0 + node.offsetHeight;
        // console.log('node',N0,N1);

        return ((N0 > E0 && N0 < E1) || (N1 > E0 && N1 < E1)); // one or both boundaries inside the parent
        // return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
    }

    removeInvisibleLines() {
        var t = performance.now();
        var lines = this.lines().length;
        // console.log('removeInvisibleLines:', this.lines().length);
        this.TBL.querySelectorAll('tr').forEach(n => {
            // console.log('isVisible',n,this.isVisible(n));
            if (!this.isVisible(n, 100)) n.remove();
        });
        // console.log('--- done in time', Math.round(performance.now() - t));
        console.log('DEL', lines - this.lines().length, 'in', Math.round(performance.now() - t), 'ms');
    }
    scrollHandler() {
        var t = performance.now();
        for(var i=0; i<5; i++){
            if (this.isVisible(this.S0))
                this.insertAbove();
            if (this.isVisible(this.S1))
                this.insertBelow();
        }
        this.removeInvisibleLines();
        if(Math.round(performance.now() - t))
            console.log('scroll in', Math.round(performance.now() - t), 'ms');
    }
    insertAbove() { this.insert(0); }
    insertBelow() { this.insert(1); }
    insert(m) {
        var t = performance.now();
        var i = this.node.querySelector(`tr:${m?'last':'first'}-child`).id.substr(1) * 1 + (m?1:-1) || 1;
        var htm = this.HTML.fullLine(i, this.doc[i]);
        this.TBL.insertAdjacentHTML(m?'beforeend':'afterbegin', htm);
        if(!m) this.node.scrollBy(0,this.node.querySelector(`tr:first-child`).offsetHeight);
        this.fireChangeEvent([i]);
        // console.log('inserted', i, 'in', Math.round(performance.now() - t), 'ms');
    }
    initialContent() {
        // this.node.style['white-space'] = 'pre';
        var content = this.node.innerText;
        // console.log(content);
        // this.node.querySelector('table').innerHTML = ;
        this.reset();

        if (content) setTimeout(() => this.paste(content), 10);
        // this.node.style['white-space'] = 'nowrap';
    }


    // lineNumber(div) { return this.lines().indexOf(div) + 1; }
    lines() { return Array.from(this.node.querySelectorAll('td:nth-child(2)>div')) }
    line(i) {
        // var line = this.node.querySelectorAll('td:nth-child(2)>div').item(i-1);
        if (i * 1 == i) var line = this.lines()[i - 1];
        else line = i;
        if (!line) return;
        // console.log('line',line,line.innerText);
        return {
            node: line,
            content: s => s === undefined ? this.STRING.decode(line.innerText) : (line.innerHTML = this.HTML.line(s)),
            remove: () => line.closest('tr').remove(),
            cursor: () => this.cursor().put(line), //.insertAdjacentHTML('beforeend',this.cursor.markup),
            height: () => window.getComputedStyle(line).getPropertyValue('height').replace('px', '') * 1,
            next: () => this.DOM(line.closest('tr')).next('tr'),
            prev: () => this.DOM(line.closest('tr')).prev('tr'),
            children: () => Array.from(line.querySelectorAll('s')),
            number: () => this.lines().indexOf(line) + 1,
            char: j => {
                var char = line.querySelectorAll('s').item(j - 1)
                return {
                    node: char,
                    content: c => c === undefined ? this.STRING.decode(char.innerText) : (char.innerText = this.STRING.encode(c)),
                    remove: () => char.remove(),
                    cursor: () => this.cursor().put(char)
                }
            }
        }
    }
    // nodeAt(x,y){ return }
    closestSide(x, y) {
        var b = document.elementFromPoint(x, y).getBoundingClientRect();
        var left = x - b.left;
        var right = b.right - x;
        return left < right ? 0 : 1;
    }
    handleClick(e) { // set cursor
        console.log('cick', e.target, e);
        this.cursor().put(e.target, this.closestSide(e.screenX, e.screenY));
    }
    cursor() {
        var cur = this.node.querySelector('cursor');
        var C = {
            node: cur,
            x: () => cur.getBoundingClientRect().left,
            y: () => cur.getBoundingClientRect().top,
            pos: () => cur.getBoundingClientRect(),
            line: () => this.line(cur.parentElement),
            // nextLine: () => this.DOM(cur.closest('tr')).next('tr')
            put: (node, pos) => {
                console.log('put cursor', node, pos);
                if (!node.nodeName) return;
                if (cur) cur.remove();
                if (node.nodeName == 'TD')
                    node = node.querySelector('div');
                if (node.nodeName == 'DIV')
                    node.insertAdjacentHTML(pos ? 'beforeend' : 'afterbegin', this.HTML.cursor());
                if (node.nodeName == 'S')
                    node.insertAdjacentHTML(pos ? 'afterend' : 'beforebegin', this.HTML.cursor());
            },
        }
        var node;
        var C2 = {
            allLeft: () => C.put(cur.parentElement, 0),
            allRight: () => C.put(cur.parentElement, 1),
            allUp: () => C.put(this.node.querySelector('tr:first-child div'), 0),
            allDown: () => C.put(this.node.querySelector('tr:last-child div'), 0),

            left: () => {
                if (node = this.DOM(cur).prev('s'))
                    return C.put(node, 0);
                if (node = this.DOM(cur.closest('tr')).prev('tr'))
                    return C.put(node.querySelector('div'), 1)
            },
            right: () => {
                if (node = this.DOM(cur).next('s'))
                    return C.put(node, 1);
                if (node = C.line().next())
                    return C.put(node.querySelector('div'), 0)
            },
            show: (y = 0) => document.body.insertAdjacentHTML('beforeend', `<div class='point' style='left:${C.x()}px; top:${C.y()+y}px;'></div>`),
            above: () => document.elementFromPoint(C.x(), C.y() - 5),
            // below: () => document.elementFromPoint(C.x(), C.y() + C.line().height() + 5),
            up: () => C.put(document.elementFromPoint(C.x(), C.y() - 15), this.closestSide(C.x(), C.y() - 10)),
            down: () => C.put(document.elementFromPoint(C.x(), C.y() + 30), this.closestSide(C.x(), C.y() + 25)),
            down2: () => C.put(document.elementFromPoint(C.x(), C.y() + 30), this.closestSide(C.x(), C.y() + 25)),
            // C.line().height()

        }
        return Object.assign({}, C, C2);
    }
    // movePos(node,mod){
    //     var cur = this.cursor();
    //     var pos = cur.pos();
    //     for(var i=0; i<9; i++)
    // }
    handleSelection() {
        // console.log('Selection changed.');
        // var node = this.selection().end();
        var sel = window.getSelection();
        if (sel.focusNode) this.cursor().put(sel.focusNode.parentElement, sel.focusOffset);
    }
    selection() {
        var sel = window.getSelection();
        return {
            content: () => sel.toString(),
            remove: () => sel.deleteFromDocument(),
            // start: () => sel.baseNode ? sel.baseNode.parentElement : null,
            // end: () => sel.focusNode ? sel.focusNode.parentElement : null,
        }
    }

    content(v) {
        if (v === undefined) // get content
            return this.lines().map(i => this.STRING.decode(i.innerText)).join("\n");

        // set content
        var htm = this.HTML.multipleLines(v); //markupFromPlain(v);
        this.node.querySelector('table').innerHTML = htm;
        setTimeout(this.fireChangeEvent.bind(this), 10);
    }



    handleKeys(e) {
        // console.log('KEY',e.code, e.key, e);
        var K = e.key;
        if (e.key.startsWith('Arrow')) {
            e.preventDefault();
            window.getSelection().removeAllRanges();
            if (e.metaKey)
                return this.cursor()['all' + e.key.replace('Arrow', '')]();
            else
                return this.cursor()[e.key.replace('Arrow', '').toLowerCase()]();
        }
        if (e.code == 'Space')
            e.preventDefault(); // prevent space-scroll

        if (K == 'Backspace')
            return this.delChar();

        if (K == 'Enter')
            return this.paste("\n");

        if (!e.metaKey)
            if (!e.ctrlKey)
                this.addChar(e.key);

    }

    fireChangeEvent(lines) {
        // console.log('fire',lines);
        this.node.dispatchEvent(
            new CustomEvent('change', { detail: { lines: lines } })
        );
    }

    delChar() {
        var node;
        if (node = this.DOM(this.cursor().node).prev('s'))
            node.remove();
        this.fireChangeEvent([this.cursor().line().number()]);
    }
    addChar(key) {
        if (key.length > 1) return;
        // console.log('add',key);
        key = this.STRING.encode(key);
        this.cursor().node.insertAdjacentHTML('beforebegin', `<s>${key}</s>`);
        this.fireChangeEvent([this.cursor().line().number()]);
        // this.fireChangeEvent([this.lineNumber(this.cursor.node.closest('td>div'))]);
    }
    paste(txt) {
        var lines = txt.split("\n");
        this.cursor().node.insertAdjacentHTML('beforebegin',
            this.HTML.multipleChars(lines[0])
        );
        this.cursor().node.closest('tr').insertAdjacentHTML('afterend',
            this.HTML.multipleLines(lines.slice(1).join("\n"))
        );

        var afterCursor = document.querySelectorAll('cursor ~ s'); // stuff after cursor
        var changes = [this.cursor().line().number(), lines.length];
        this.line(changes[0] + changes[1] - 1).cursor(); // move cursor to new position
        var line = this.cursor().line().node; // get new cursor position
        afterCursor.forEach(n => line.insertBefore(n, null)); // insert old stuff after new cursor

        console.log('pasted lines', changes[0], changes[1]);
        this.fireChangeEvent([...Array(changes[1]).keys()].map(v => changes[0] + v));
    }



    DOM(currentNode) {
        return {
            prev: (nodeName) => {
                while (currentNode = currentNode.previousSibling)
                    if (currentNode && currentNode.nodeName == nodeName.toUpperCase())
                        return currentNode
            },
            next: (nodeName) => {
                while (currentNode = currentNode.nextSibling)
                    if (currentNode && currentNode.nodeName == nodeName.toUpperCase())
                        return currentNode
            },

        }
    }
}





    // insertLines(a, b) {
    //     var t = performance.now();
    //     // var tot = [];
    //     // var changes = [];
    //     // var parser = new DOMParser();
    //     for (var i = a; i < b; i++) {
    //         // console.log('ADD', i);
    //         var htm = this.HTML.fullLine(i, this.doc[i]);
    //         // var dom = parser.parseFromString(htm, "text/html").body.firstChild;
    //         // console.log('dom',dom);
    //         // this.TBL.appendChild(dom );        
    //         // tot.push(htm);
    //         // changes.push(i);
    //         this.TBL.insertAdjacentHTML('beforeend', htm);
    //     }
    //     // this.TBL.insertAdjacentHTML(insPoint, tot.join(''));
    //     // this.fireChangeEvent(changes);
    //     console.log('inserted', a, '-', b, 'in', Math.round(performance.now() - t), 'ms');
    // }

    // removeLines(a, b) {
    //     // setTimeout(() => {
    //     var t = performance.now();
    //     var vis = this.VIS[1] - this.VIS[0];
    //     if (vis > 50)
    //         for (var i = 0; i < 10; i++) {
    //             var d = document.querySelector('#L' + (this.VIS[0]++));
    //             // console.log('DEL', d, '#L' + (this.VIS[0]));
    //             if (d) d.remove();
    //         }
    //     console.log('removed', a, b, 'in time', Math.round(performance.now() - t));
    //     console.log('remaining lines:', this.lines().length);
    //     // }, 10);
    // }

    // render(amount) {
    //     var t = performance.now();
    //     if (amount > 0) {
    //         var a = this.VIS[1];
    //         var b = a + amount;
    //         var insPoint = 'beforeend';
    //         this.VIS[1] = b;
    //     } else {
    //         var b = this.VIS[0];
    //         var a = b + amount;
    //         var insPoint = 'afterbegin';
    //         this.VIS[0] = a;
    //     }
    //     this.insertLines(a, b);

    // }




// var c = this.cursor();
// switch (e.target.nodeName) {
//     case 'TD':
//         return c.put(e.target.querySelector('DIV'), 1);
//     case 'DIV':
//         return c.put(e.target, 1);
//     case 'S':
//         return c.put(e.target, 1);
// }
// x: () => cur.offsetLeft,
// y: () => cur.offsetTop,


    // insertLine(i) {
    //     var t = performance.now();
    //     var htm = this.HTML.fullLine(i, this.doc[i]);
    //     this.TBL.appendChild(dom);
    //     console.log('INS', i, 'in time', Math.round(performance.now() - t));
    // }


        // console.log('scroll', this.isVisible(this.S0), this.isVisible(this.S1) );
        // if (this.isVisible(this.S0))
        //     this.render(-10);
        // if (this.isVisible(this.S1))
        // this.render(10);
        


    // insertAbove() {
    //     var t = performance.now();
    //     var i = this.node.querySelector('tr:first-child').id.substr(1) * 1 - 1 || 1;
    //     if(i<1) return;
    //     var htm = this.HTML.fullLine(i, this.doc[i]);
    //     this.TBL.insertAdjacentHTML('afterbegin', htm);
    //     // this.TBL.appendChild(dom);
    //     console.log('inserted', i, 'in', Math.round(performance.now() - t), 'ms');
    // }
    // insertBelow() {
    //     var t = performance.now();
    //     var i = this.node.querySelector('tr:last-child').id.substr(1) * 1 + 1 || 1;
    //     var htm = this.HTML.fullLine(i, this.doc[i]);
    //     this.TBL.insertAdjacentHTML('beforeend', htm);
    //     // this.TBL.appendChild(dom);
    //     console.log('inserted', i, 'in', Math.round(performance.now() - t), 'ms');
    // }


        // while (this.isVisible(this.S0))
        //     this.insertAbove();
        // while (this.isVisible(this.S1))
        //     this.insertBelow();

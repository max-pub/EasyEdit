class EasyEditColor {
    constructor(editor) {
        this.editor = editor;
        this.RE = {};
        this.editor.node.addEventListener('change', e => {
            // return;
            var lines = e.detail.lines;
            // console.log('highlight',lines);
            if (lines)
                lines.forEach(l=>this.match(l))
                // this.match(lines[0]);

        })
    }
    load() {
        fetch('smd.json').then(x => x.json()).then(x => console.log('x', x));
    }
    set highlight(regex) {
        for (var key in regex)
            this.RE[key] = new RegExp(regex[key], "g");
    }
    match(i) {
        console.log('check matches in line',i);
        var line = this.editor.line(i);
        // console.log('-- in line',line);
        var txt = line.content();
        console.log('-- in text',txt);
        var lineMatches = [],
            charMatches = [];
        for (var key in this.RE) {
            // var RE = new RegExp(this.RE[key], "g");
            var RE = this.RE[key];
            var match;
            while (match = RE.exec(txt)) {
                if (txt.length == match[0].length)
                    lineMatches.push([key, match[0]])
                else
                    charMatches.push([key, match[0], match.index, match.index + match[0].length]);
                // console.log('-- length',txt.length,match[0].length );
            }
        }
        // console.log('---- found',lineMatches, charMatches);
        this.updateLine(i, lineMatches);
        this.updateChars(i, charMatches);
    }
    updateLine(i, update) {
        var line = this.editor.line(i);
        var matchKeys = update.map(i => i[0]);
        line.node.setAttribute('class', matchKeys.join(' '));
        line.node.closest('tr').setAttribute('class', matchKeys.join(' '));

    }
    updateChars(i, update) {
        this.editor.line(i).children().forEach((c, n) => {
            c.setAttribute('class',
                update.filter(u => ((n >= u[2]) && (n < u[3]) )).map(u => u[0]).join(' ')
            );
        });
    }
}






        // console.log('---- updateChars', update);
        // var chars = this.editor.line(i).children();
        // var charClass = [];


                // console.log('---- updateLine',update);
        // var allKeys = Object.keys(this.RE);
        // console.log('---- updateLine',allKeys,matchKeys);
        // var CL = line.node.classList;
        // allKeys.forEach(m=>matchKeys.includes(m)?CL.add(m):CL.remove(m));
        // update.forEach(u=>CL.add(u[0]))

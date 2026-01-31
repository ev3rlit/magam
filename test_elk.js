const ELK = require('elkjs');
console.log('ELK imported');
try {
    const elk = new ELK();
    console.log('ELK instantiated');
    elk.layout({
        id: 'root',
        children: [
            { id: 'n1', width: 10, height: 10 },
            { id: 'n2', width: 10, height: 10 }
        ],
        edges: []
    }).then(() => {
        console.log('Layout success');
    }).catch(e => {
        console.error('Layout error:', e);
    });
} catch (e) {
    console.error('Instantiation error:', e);
}

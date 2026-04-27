const fs = require('fs');
const sourceMap = require('source-map');

(async () => {
    const rawSourceMap = fs.readFileSync('./dist/assets/index-46ardZfb.js.map', 'utf8');
    const consumer = await new sourceMap.SourceMapConsumer(rawSourceMap);
    
    const pos = consumer.originalPositionFor({
        line: 175,
        column: 28155
    });
    
    console.log(pos);
    consumer.destroy();
})();

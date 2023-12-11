function defineGenerator() {
    let command = ['up', 'down', 'left', 'right'];
    for (let dir = 0; dir < 4; dir++) {
        let cap =  command[dir].charAt(0).toUpperCase() + command[dir].slice(1);
        javascript.javascriptGenerator.forBlock["move_" + command[dir]] = function(block, generator) {
            return "await move" + cap + "();\n";
        };
        javascript.javascriptGenerator.forBlock["mark_" + command[dir]] = function(block, generator) {
            return "await mark" + cap + "();\n";
        };
    }
}
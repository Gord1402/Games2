
let sql = require('sql');

sql.setDialect('sqlite');

let game_states = sql.define({
    name: 'game_states',
    columns: [{name:'user_id', dataType:"Integer", primaryKey: true},
              {name:'game_id', dataType:"String", primaryKey: true},
              {name:'state', dataType:"String"},],
});


console.log(game_states.create().toQuery().text)
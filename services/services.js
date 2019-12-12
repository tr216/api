exports.etuliaConnector=require('./local-connector/local-connector.js');

exports.tasks=require('./tasks/tasks.js');
exports.posDevice=require('./pos-device/pos-device.js');

exports.scheduler=require('./scheduler/scheduler.js');
exports.eInvoice=require('./e-invoice/e-invoice.js');
exports.eLedger=require('./e-ledger/e-ledger.js');

exports.start=()=>{
	console.log('Main Service started.');
}

exports.start();


// var ejs = require('ejs');
// var people = ['geddy', 'neil', 'alex'];
// var str='<% people.forEach((e)=>{>%><p>merhaba:<%=e%></p><%}); %><hr>';
// var html='';
// try{
// 	html=ejs.render(str, {people: people});
// 	console.log(html);
// }catch(e){
// 	console.log('render hatasi:',e.name);
// }


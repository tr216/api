module.exports=function(conn){
	var schema = mongoose.Schema({
		name: {type: String, required: [true,'Isim gereklidir.']},
		type: {type: String, required: [true,'Program türü gereklidir.'],enum:['file-importer','file-exporter','connector-importer','connector-exporter','email','sms']},
		collections:[{
			name:{type :String, default:''},
			filter:{type :String, default:''}
		}],
		files:[{
			fileName:{type :String, default:''},
			data:{type :String, default:''}, //base64
			randerEngine:{type :String, default:'ejs'}
		}],
		importer:{
			accept:{type :String, default: ''}
		},
		exporter:{
			fileName:{type :String, default: ''}
		},
		connector:{
			connectorId: {type: String, default:''},
			connectorPass: {type: String, default:''},
			connectionType: {type: String, enum:['mssql','mysql','file','console','js','bat','bash','wscript','cscript'],default:'js'},
			connection:{
				server: {type :String, default: ''},
				port:{type :Number, default: 0},
				database:{type :String, default: ''},
				username: {type :String, default: ''},
				password: {type :String, default: ''}
			}
		},
		crontab:{type :String, default: ''},	
		createdDate: { type: Date,default: Date.now},
		modifiedDate:{ type: Date,default: Date.now},
		passive: {type: Boolean, default: false}
	})

	schema.pre('save', function(next) {
		next()
	})
	schema.pre('remove', function(next) {
		next()
	})

	schema.pre('remove', true, function(next, done) {
		next()

	})

	schema.on('init', function(model) {

	})
	schema.plugin(mongoosePaginate)


	var collectionName='programs'
	var model=conn.model(collectionName, schema)

	model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }

    //model.relations={pos_devices:'localConnector'}

    return model
  }

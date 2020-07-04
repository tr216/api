exports.connectDatabase=function(_id,userDb,userDbHost,dbName,cb){
	if(client.db[_id]!=undefined){
        return cb(null)
    }

    var usrConn = mongoose.createConnection(userDbHost + userDb,{ useNewUrlParser: true, useUnifiedTopology:true, autoIndex: true})
    usrConn.on('connected', function () {  
        eventLog(`client.db ${dbName.brightGreen} connected.`)
	    client.db[_id]={}
	    Object.keys(client.dbModels).forEach((e)=>{
	    	client.db[_id][e]=client.dbModels[e](usrConn)
	    })
	    
        client.db[_id]['_id']=_id
        client.db[_id]['userDb']=_id
        client.db[_id]['dbName']=dbName
        client.db[_id]['conn']=usrConn
        
        if(cb)
        	cb(null)
    }) 

    usrConn.on('error',function (err) {  
        errorLog('Mongoose user connection "' + userDbHost + userDb + '" error: ', err)
        if(cb)
        	cb(err)
    }) 
}


exports.init_all_databases=function(callback){
	global.client.db={}
	db.dbdefines.find({deleted:false,passive:false},(err,docs)=>{
        if(!err){
            var startFunc=(new Date()).yyyymmddhhmmss()
            var veriAmbarlari=[]
            docs.forEach((doc,index)=>{
                doc['finish']=false
                veriAmbarlari.push(doc)
            })

            veriAmbarlari.forEach((doc)=>{
            	
                exports.connectDatabase(doc._id,doc.userDb,doc.userDbHost,doc.dbName,(err)=>{
                    doc.finish=true
                })
            })
                       

            function kontrolet(cb){
                var bitmemisVar=false
                veriAmbarlari.forEach((doc)=>{
                    if(doc.finish==false){
                        bitmemisVar=true
                        return
                    }
                })
                if(bitmemisVar){
                    setTimeout(kontrolet,0,cb)
                }else{
                    cb(null)
                }
            }

            kontrolet((err)=>{
              
                callback(err)
            })
            
        }else{
            callback(err)
        }
    })
}

module.exports=(cb)=>{
	moduleLoader(path.join(__dirname, 'db.collections'),'.collection.js','client db',(err,holder)=>{
		if(!err){
			client.dbModels=holder
			exports.init_all_databases(cb)
		}else{
			cb(err)
		}
		
	})
}
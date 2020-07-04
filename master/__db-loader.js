module.exports=(cb)=>{
	init((err)=>{
		if(!err){
			moduleLoader(path.join(__dirname, 'db.collections'),'.collection.js','master db',(err,holder)=>{
				if(!err){
					global.db=holder
					cb(null)
				}else{
					cb(err)
				}
			})
		}else{

			cb(err)
		}
	})
	
}



function init(callback){
	global.mongoose = require('mongoose')
	global.mongoosePaginate = require('mongoose-paginate-v2')
	global.mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2')
	mongoosePaginate.paginate.options = { 
	    lean:  true,
	    limit: 10
	}
	global.ObjectId = mongoose.Types.ObjectId

	mongoose.set('useCreateIndex', true)
	mongoose.set('useFindAndModify', false)


	global.dbconn = mongoose.createConnection(config.mongodb.address,{ useNewUrlParser: true ,useUnifiedTopology:true, autoIndex: true  })

	global.sendToTrash=(conn,collectionName,member,filter,cb)=>{
	    conn.model(collectionName).findOne(filter,(err,doc)=>{
	        if(!err){
	            function silelim(cb1){
	                conn.model('recycle').insertMany([{collectionName:collectionName,documentId:doc._id,document:doc,deletedBy:member.username}],(err)=>{
	                    if(!err){
	                        conn.model(collectionName).deleteOne(filter,(err,doc)=>{
	                            cb1(err,doc)
	                        })
	                    }else{
	                        cb1(err)
	                    }
	                })
	            }

	            if(conn.model(collectionName).relations){
	                var keys=Object.keys(conn.model(collectionName).relations)
	                var index=0

	                function kontrolEt(cb2){
	                    if(index>=keys.length){
	                        cb2(null)
	                    }else{
	                        var relationFilter={}
	                        var k=keys[index]

	                        relationFilter[conn.model(collectionName).relations[k]]=doc._id
	                        conn.model(k).countDocuments(relationFilter,(err,c)=>{
	                            if(!err){
	                                if(c>0){
	                                    cb2({name:'RELATION_ERROR',message:"Bu kayit '" + k + "' tablosuna baglidir. Silemezsiniz!"})

	                                }else{
	                                    index++
	                                    setTimeout(kontrolEt,0,cb2)
	                                }
	                            }else{
	                                cb2(err)
	                            }
	                        })
	                    }
	                }

	                kontrolEt((err)=>{
	                    if(!err){
	                        silelim(cb)
	                    }else{

	                        cb(err)
	                    }
	                })
	            }else{
	                silelim(cb)
	            }
	            
	        }else{
	            cb(err)
	        }
	    })
	}


	global.dberr=(err,cb)=>{
	    if(!err){
	        return true
	    }else{
	        cb({success: false, error: {code: err.name, message: err.message}})
	        return false
	    }
	}

	global.dbnull=(doc,cb)=>{
	    if(doc!=null){
	        return true
	    }else{
	        cb({success: false, error: {code: 'RECORD_NOT_FOUND', message: 'Kayit bulunamadi'}})
	        return false
	    }
	}


	mongoose.set('debug', false)

	process.on('SIGINT', function() {  
	  mongoose.connection.close(function () { 
	    eventLog('Mongoose default connection disconnected through app termination') 
	    process.exit(0) 
	  }) 
	}) 

	global.epValidateSync=(doc)=>{
	    var err = doc.validateSync()
	    if(err){
	        var keys=Object.keys(err.errors)
	        var returnError={name:'VALIDATION_ERROR',message:''}
	        keys.forEach((e,index)=>{
	        	returnError.message +=`Hata ${(index+1).toString()} : ${err.errors[e].message}`
	            if(index<keys.length-1)
	                returnError.message +='  |  '
	            
	        })
	        
	        return returnError
	    }else{
	        return err
	    }
	}

	dbconn.on('connected', function () { 
        eventLog('Mongoose connected to ' + config.mongodb.address.brightBlue)
        callback(null)
    }) 


    dbconn.on('error',function (err) {  
        errorLog('Mongoose default connection error: ', err)
        callback(err)
    }) 

    dbconn.on('disconnected', function () {  
        eventLog('Mongoose default connection disconnected') 
    })
}

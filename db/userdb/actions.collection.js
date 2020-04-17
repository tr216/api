module.exports=function(conn){
    var schema = mongoose.Schema({
        connId: {type: mongoose.Schema.Types.ObjectId, ref: 'actions', default:null, index:true},
        actionType:{type: String, trim:true, default: '', index:true},
        actionCode:{type: String, trim:true, default: '', index:true},
        issueDate:{type: String, trim:true, default: '', index:true},
        issueTime:{type: String, trim:true, default: '', index:true},
        ioType: {type: Number, default: -1, index:true},
        docId:{type: Object, default: null, index:true},
        docNo:{type: String, trim:true, default: '', index:true},
        description:{type: String, trim:true, default: '', index:true},
        inventory:{
            locationId:{type: mongoose.Schema.Types.ObjectId, ref: 'locations', default:null, index:true},
            locationId2:{type: mongoose.Schema.Types.ObjectId, ref: 'locations', default:null, index:true},
            itemId:{type: mongoose.Schema.Types.ObjectId, ref: 'items', default:null, index:true},
            quantity: {type: Number, default: 0, index:true},
            quantity2: {type: Number, default: 0, index:true},
            quantity3: {type: Number, default: 0, index:true},
            unitCode:{type: String, trim:true, default: '', index:true}
        },
        party:{
            partyId:{type: mongoose.Schema.Types.ObjectId, ref: 'parties', default:null, index:true},
            amount: {type: Number, default: 0, index:true},
            currencyID:{type: String, trim:true, default: '', index:true},
            exchangeRate: {type: Number, default: 0, index:true},
            currencyAmount: {type: Number, default: 0, index:true}
        },
        bank:{
            bankId:{type: Object, default:null, index:true}, //qwerty
            amount: {type: Number, default: 0, index:true},
            currencyID:{type: String, trim:true, default: '', index:true},
            exchangeRate: {type: Number, default: 0, index:true},
            currencyAmount: {type: Number, default: 0, index:true}
        },
        cash:{
            cashSafeId:{type: Object, default:null, index:true}, //qwerty
            amount: {type: Number, default: 0, index:true},
            currencyID:{type: String, trim:true, default: '', index:true},
            exchangeRate: {type: Number, default: 0, index:true},
            currencyAmount: {type: Number, default: 0, index:true}
        },
        person:{
            personId:{type: mongoose.Schema.Types.ObjectId, ref: 'persons', default:null, index:true},
            amount: {type: Number, default: 0, index:true},
            currencyID:{type: String, trim:true, default: '', index:true},
            exchangeRate: {type: Number, default: 0, index:true},
            currencyAmount: {type: Number, default: 0, index:true}
        },
        createdDate: { type: Date, default: Date.now},
        modifiedDate:{ type: Date, default: Date.now}
    });

    

    schema.pre('save', function(next) {
        updateBalances(conn,this,false, next);
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'));
        
    });
    
    schema.pre('deleteMany', function(next) {
        conn.model('actions').find(this._conditions,(err,docs)=>{
            if(!err){
                updateBalances(conn,docs,true,next);
            }else{
                next(err);
            }
            
        });
        
    });

    schema.pre('deleteOne', function(next,deger) {
        
        conn.model('actions').findOne(this._conditions,(err,doc)=>{
            if(!err){
                updateBalances(conn,doc,true,next);
            }else{
                next(err);
            }
            
        });
    });

    schema.pre('remove', function(next) {
        console.log('actions.remove this:',this);
        next();
    });

    schema.pre('remove', true, function(next, done) {
        console.log('actions.remove done this:',this);
        next();
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'));
    });

    
    schema.on('init', function(model) {

    });
    

    schema.plugin(mongoosePaginate);
    schema.plugin(mongooseAggregatePaginate);
    
  
        
    var collectionName='actions';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    return model;
}


function updateBalances(conn,docs,tersMi,next){

    var index=0;
    var docList=[];
    if(Array.isArray(docs)){
        docList=docs;
    }else{
        docList.push(docs);
    }
    function basla(cb){
        if(index>=docList.length) return cb(null);
        updateInventory(conn,docList[index],tersMi,(err)=>{
            if(!err){
                index++;
                setTimeout(basla,0,cb);
            }else{
                cb(err);
            }
        })
    }

    basla((err)=>{
        if(!err){
            next();
        }else{
            next(err);
        }
    })
}

function updateInventory(conn,doc,tersMi,cb){
    if(!doc.inventory) return cb(null);
    if(!doc.inventory.itemId) return cb(null);

    var ioTypeCarpan=doc.ioType==0?-1:1;
    if(tersMi) ioTypeCarpan=ioTypeCarpan * -1;

    conn.model('inventory_lives').findOne({item:doc.inventory.itemId},(err,update)=>{
        if(!err){
            if(update!=null){
                if(doc.inventory.locationId.toString()==doc.inventory.locationId2.toString()){   // lokasyonlar esitse satis veya alis olmustur genel stok degisir
                    update.quantity=update.quantity + ioTypeCarpan*doc.inventory.quantity;
                    update.quantity2=update.quantity2 + ioTypeCarpan*doc.inventory.quantity2;
                    update.quantity3=update.quantity3 + ioTypeCarpan*doc.inventory.quantity3;
                }
                update.locations.forEach((e)=>{
                    if(e.locationId.toString()==doc.inventory.locationId.toString()){
                        e.quantity=e.quantity + ioTypeCarpan*doc.inventory.quantity;
                        e.quantity2=e.quantity2 + ioTypeCarpan*doc.inventory.quantity2;
                        e.quantity3=e.quantity3 + ioTypeCarpan*doc.inventory.quantity3;
                        return;
                    }
                });
                if(doc.inventory.locationId.toString()!=doc.inventory.locationId2.toString()){
                    update.locations.forEach((e)=>{
                        if(e.locationId.toString()==oldDoc.inventory.locationId2.toString()){
                            e.quantity=e.quantity + -1*ioTypeCarpan*doc.inventory.quantity;
                            e.quantity2=e.quantity2 + -1*ioTypeCarpan*doc.inventory.quantity2;
                            e.quantity3=e.quantity3 + -1*ioTypeCarpan*doc.inventory.quantity3;
                            return;
                        }
                    });
                }
                update.lastModified=new Date();
                update.save((err,update2)=>{
                    if(!err){
                        cb();
                    }else{
                        cb(err);
                    }
                })
            }else{
                update=conn.model('inventory_lives')({
                    item:doc.inventory.itemId,
                    quantity: 0,
                    quantity2: 0,
                    quantity3: 0,
                    unitCode:doc.inventory.unitCode,
                    locations:[{
                        locationId:doc.inventory.locationId,
                        quantity: ioTypeCarpan*doc.inventory.quantity,
                        quantity2: ioTypeCarpan*doc.inventory.quantity2,
                        quantity3: ioTypeCarpan*doc.inventory.quantity3,
                        unitCode:doc.inventory.unitCode
                    }],
                    lastModified:(new Date())
                });

                if(doc.inventory.locationId==doc.inventory.locationId2){
                    update.quantity= ioTypeCarpan*doc.inventory.quantity;
                    update.quantity2= ioTypeCarpan*doc.inventory.quantity2;
                    update.quantity3= ioTypeCarpan*doc.inventory.quantity3;
                }else{
                    update.locations.push({
                        locationId:doc.inventory.locationId,
                        quantity: -1*ioTypeCarpan*doc.inventory.quantity,
                        quantity2: -1*ioTypeCarpan*doc.inventory.quantity2,
                        quantity3: -1*ioTypeCarpan*doc.inventory.quantity3,
                        unitCode:doc.inventory.unitCode
                    })
                }
                update.save((err,update2)=>{
                    if(!err){
                        cb();
                    }else{
                        cb(err);
                    }
                })
            }
        }else{
            cb(err);
        }
    });
}
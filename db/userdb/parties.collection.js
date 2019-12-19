module.exports=function(conn){
    var schema = mongoose.Schema({
        partyType:{ type: String, trim:true, default: '',enum:['Customer','Vendor','CustomerAgency','VendorAgency']},
        mainParty: {type: mongoose.Schema.Types.ObjectId, ref: 'parties',
        	validate: {
              validator: function(v) {
                if((this.partyType=='CustomerAgeny' || this.partyType=='VendorAgeny') && ( (v || '') == '')){
                    return false;
                }else{
                    return true;
                }
              },
              message: 'Acente eklerken, ana firma secmelisiniz'
            }
        },
        websiteURI:{ type: String, trim:true, default: ''},
        partyIdentification:[{
            schemeId:{ type: String, trim:true, default: 'VKN'},
            id:{ type: String, trim:true, default: ''}
        }],
        partyName:{
            name:{ type: String, trim:true, default: ''}
        },
        postalAddress:{
            room:{ type: String, trim:true, default: ''},
            streetName:{ type: String, trim:true, default: ''},
            blockName:{ type: String, trim:true, default: ''},
            buildingName:{ type: String, trim:true, default: ''},
            buildingNumber:{ type: String, trim:true, default: ''},
            citySubdivisionName:{ type: String, trim:true, default: ''},
            cityName:{ type: String, trim:true, default: ''},
            postalZone:{ type: String, trim:true, default: ''},
            postbox:{ type: String, trim:true, default: ''},
            region:{ type: String, trim:true, default: ''},
            district:{ type: String, trim:true, default: ''},
            country:{
                identificationCode:{ type: String, default: 'TR'},
                name:{ type: String, trim:true, default: 'Türkiye'}
            }
        },
        partyTaxScheme:{
            taxScheme:{
                name:{ type: String, trim:true, default: ''},
                taxTypeCode:{ type: String, trim:true, default: ''}
            }
        },
        contact:{
            telephone:{ type: String, trim:true, default: ''},
            telefax:{ type: String, trim:true, default: ''},
            electronicMail:{ type: String, trim:true, default: ''}
        },
        person:{
            firstName:{ type: String, trim:true, default: ''},
            middleName:{ type: String, trim:true, default: ''},
            familyName:{ type: String, trim:true, default: ''},
            nameSuffix:{ type: String, trim:true, default: ''},
            title:{ type: String, trim:true, default: ''}
        },
        passive:{type:Boolean , default:false},
        createdDate: { type: Date,default: Date.now},
        modifiedDate:{ type: Date,default: Date.now}
    });

    schema.pre('save', function(next) {
        next();
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'));
    });
    schema.pre('remove', function(next) {
        next();
    });

    schema.pre('remove', true, function(next, done) {
        next();
        //bir seyler ters giderse 
        // next(new Error('ters giden birseyler var'));
    });

    schema.on('init', function(model) {

    });
    

    schema.plugin(mongoosePaginate);
    schema.plugin(mongooseAggregatePaginate);
    

    var collectionName='parties';
    var model=conn.model(collectionName, schema);
    
    model.removeOne=(member, filter,cb)=>{ sendToTrash(conn,collectionName,member,filter,cb); }
    
    return model;
}

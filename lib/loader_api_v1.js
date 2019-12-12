var fs = require('fs');
//var path_module = require('path');
global.apiv1 = {};
global.apiv1_repo = {};
global.apiv1_system = {};

global.protectedFields=require('./protected-fields.json');

module.exports = function(app,cb) {
    LoadRepoModules((err)=>{
        if(!err){
            LoadModules((err)=>{
                if(!err){
                    LoadSystemModules((err)=>{
                        if(!err){
                            systemAPI(app);
                            userdbAPI(app);
                            mainAPI(app);
                            handlerApi(app);
                            
                            mrutil.console('Etulia Cloud API system V1 loaded.');
                        }else{
                            console.log('LoadSystemModules Error:',err);
                        }
                        cb(err);
                    });
                }else{
                    console.log('LoadModules Error:',err);
                }
                cb(err);
            });
        }else{
            console.log('LoadRepoModules Error:',err);
            cb(err);
        }
    });
}

function mainAPI(app){
   
    app.all('/api', function(req, res) {
        res.status(200).json({success: true, data:'Welcome to Etulia Portal API V1. Please use: /api/v1'});
    });

    app.all('/api/v1', function(req, res) {
        res.status(200).json({success: true, data:'Welcome to Etulia Portal API V1'});

    });
    
    app.all('/api/v1/:func', function(req, res) {
        loadMainApi(req,res);
    });
    app.all('/api/v1/:func/:param1', function(req, res) {
        loadMainApi(req,res);
    });

    app.all('/api/v1/:func/:param1/:param2', function(req, res) {
        loadMainApi(req,res);
    });

    app.all('/api/v1/:func/:param1/:param2/:param3', function(req, res) {
        loadMainApi(req,res);
    });

    function loadMainApi(req, res){
        res.set({
            'content-type': 'application/json; charset=utf-8'
        });

        if (apiv1[req.params.func] == undefined) {
            res.status(403).json({success: false, error: {code: 'UNKNOWN_FUNCTION', message: 'Unknown function'}});
        } else {

            passport(req,res,(err,member)=>{
                if(!err){
                    if((req.method=="POST" || req.method=="PUT") && protectedFields[req.params.func]!=undefined){
                        req.body=mrutil.deleteObjectFields(req.body,protectedFields[req.params.func].inputFields);
                    }
                    apiv1[req.params.func](member, req, res, function(result) {
                        if(result==null){
                            res.json({});
                        }else{
                            if(result['success']!=undefined){
                                if(result.success==false){
                                    res.status(403).json(result);
                                }else{
                                    if(protectedFields[req.params.func]!=undefined && result['data']!=undefined){
                                        if(Array.isArray(result.data)){
                                            for(let i=0;i<result.data.length;i++){
                                                result.data[i]=mrutil.deleteObjectFields(result.data[i],protectedFields[req.params.func].outputFields);
                                            }
                                        }else{
                                            if(result.data.hasOwnProperty('docs')){
                                                for(let i=0;i<result.data.docs.length;i++){
                                                    result.data.docs[i]=mrutil.deleteObjectFields(result.data.docs[i],protectedFields[req.params.func].outputFields);
                                                }
                                            }
                                            result.data=mrutil.deleteObjectFields(result.data,protectedFields[req.params.func].outputFields);
                                        }
                                        
                                    }
                                    res.status(200).json(result);
                                }
                            }else{
                                res.status(200).json(result);
                            }
                        }
                        
                    });
                }else{
                    res.status(403).json({success:false,error:err});
                }
            });
            
        }
    }
}

function systemAPI(app){
    app.all('/api/v1/system/:func', function(req, res) {
        loadSystemApi(req,res);
    });
    app.all('/api/v1/system/:func/:param1', function(req, res) {

        loadSystemApi(req,res);
    });

    app.all('/api/v1/system/:func/:param1/:param2', function(req, res) {
        loadSystemApi(req,res);
    });

    app.all('/api/v1/system/:func/:param1/:param2/:param3', function(req, res) {
        loadSystemApi(req,res);
    });
    
    function loadSystemApi(req,res){
        res.set({
            'content-type': 'application/json; charset=utf-8'
        });

        if (apiv1_system[req.params.func] == undefined) {
            res.status(403).json({success: false, error: {code: 'UNKNOWN_FUNCTION', message: 'Unknown function'}});
        } else {
            passport(req,res,(err,member)=>{
                if(!err){
                    console.log('req.params:',req.params);
                    console.log('member:',member);
                    if(member.isSysUser!=true) return res.status(403).json({success: false, error: {code: 'AUTHENTICATION_FAILED', message: 'Authentication failed'}});
                    
                    if((req.method=="POST" || req.method=="PUT") && protectedFields[req.params.func]!=undefined){
                        req.body=mrutil.deleteObjectFields(req.body,protectedFields[req.params.func].inputFields);
                    }
                    apiv1_system[req.params.func](member, req, res, function(result) {
                        if(result==null){
                            res.json({});
                        }else{
                            if(result['success']!=undefined){
                                if(result.success==false){
                                    res.status(403).json(result);
                                }else{
                                    if(protectedFields[req.params.func]!=undefined && result['data']!=undefined){
                                        if(Array.isArray(result.data)){
                                            for(let i=0;i<result.data.length;i++){
                                                result.data[i]=mrutil.deleteObjectFields(result.data[i],protectedFields[req.params.func].outputFields);
                                            }
                                        }else{
                                            if(result.data.hasOwnProperty('docs')){
                                                for(let i=0;i<result.data.docs.length;i++){
                                                    result.data.docs[i]=mrutil.deleteObjectFields(result.data.docs[i],protectedFields[req.params.func].outputFields);
                                                }
                                            }
                                            result.data=mrutil.deleteObjectFields(result.data,protectedFields[req.params.func].outputFields);
                                        }
                                        
                                    }
                                    res.status(200).json(result);
                                }
                            }else{
                                res.status(200).json(result);
                            }
                        }
                        
                    });
                }else{
                    res.status(403).json({success:false,error:err});
                }
            });
        }
    }
    
}

function userdbAPI(app){
    app.all('/api/v1/:dbId/:func', function(req, res,next) {
        loadUserDbApi(req,res,next);
    });
    app.all('/api/v1/:dbId/:func/:param1', function(req, res,next) {
        loadUserDbApi(req,res,next);
    });

    app.all('/api/v1/:dbId/:func/:param1/:param2', function(req, res,next) {
        loadUserDbApi(req,res,next);
    });

    app.all('/api/v1/:dbId/:func/:param1/:param2/:param3', function(req, res,next) {
        loadUserDbApi(req,res,next);
    });


    function loadUserDbApi(req, res,next) {

        res.set({
            'content-type': 'application/json; charset=utf-8'
        });

        if (repoDb[req.params.dbId] == undefined) {

            return next();
        } else {
            passportRepo(req,res,(err,data)=>{
                if(!err){
                    if(apiv1_repo[req.params.func]==undefined){
                        res.status(403).json({success: false, error: {code: 'REPO_API_UNKNOWN_FUNCTION', message: 'Unknown function'}});
                        return;
                    }

                    if((req.method=="POST" || req.method=="PUT") && protectedFields[req.params.func]!=undefined){
                        req.body=mrutil.deleteObjectFields(req.body,protectedFields[req.params.func].inputFields);
                    }
                    var member = data.member;
                    apiv1_repo[req.params.func](repoDb[req.params.dbId],member, req, res, function(result) {
                        if(result==null){
                            res.json({});
                        }else{
                            if(result['success']!=undefined){
                                if(result.success==false){
                                    res.status(403).json(result);
                                }else{
                                    
                                    if(result['data']!=undefined){
                                        if(Array.isArray(result.data)){
                                            for(let i=0;i<result.data.length;i++){
                                                result.data[i]=mrutil.deleteObjectFields(result.data[i],protectedFields[req.params.func].outputFields);
                                            }
                                        }else{
                                            if(result.data.hasOwnProperty('docs')){
                                                for(let i=0;i<result.data.docs.length;i++){
                                                    result.data.docs[i]=mrutil.deleteObjectFields(result.data.docs[i],protectedFields[req.params.func].outputFields);
                                                }
                                            }
                                            result.data=mrutil.deleteObjectFields(result.data,protectedFields[req.params.func].outputFields);
                                        }
                                        
                                    }
                                    res.status(200).json(result);
                                }
                            }else{
                                res.status(200).json(result);
                            }
                        }
                        
                    })
                }else{
                    res.status(403).json({success:false,error:err});
                }
            });
            
        }
    }

   
}

function handlerApi(app){
    // catch 404 and forward to error handler
    app.use(function(req, res, next) {
        console.log(req.params);
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use(function(err, req, res, next) {
          res.status(err.status || 500);
          console.log(err);
          res.end('{success:false,error: {code:500,message:"' + err.message + '"}}');
          // res.render('error', {
          //   message: err.message,
          //   error: err
          // });
        });
    }


    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.end('{success:false,error: {code:500,message:"' + err.message + '"}}');
    // res.render('error', {
    //   message: err.message,
    //   error: {}
    // });
    });
}
// var isAuthenticated = function(req, res, next) {
    
//     res.set({
//         'content-type': 'application/json; charset=utf-8'
//     });
//     if (req.params.func == 'login' || req.params.func == 'signup' || req.params.func == 'verify') {
//         console.log(req.params.func);
//         apiv1[req.params.func](req, res, function(result) {
//             console.log(req.params.func + ' fonksiyon ici');
//             if(result.hasOwnProperty('success')){
//                 if(result.success==false){
//                     res.status(403).json(result);
//                 }else{
//                     res.status(200).json(result);
//                 }
//             }else{
//                 res.status(200).json(result);
//             }
//         });
//     } else {

//         passport(req, res, function(info) {
//             if (info.success) {
//                 return next();
//             } else {
//                 res.status(403).json({
//                     success: false,
//                     error: {
//                         code: 'AUTHENTICATION_FAILED',
//                         message: 'Authentication failed'
//                     }
//                 });

//             }
//         });
//     }



// }


function LoadModules(cb) {
    try{
        var DIR = path_module.join(__dirname, '../api.v1');
        var files=fs.readdirSync(DIR);

        var f, l = files.length;
        for (var i = 0; i < l; i++) {
            f = path_module.join(DIR, files[i]);
            if(!fs.statSync(f).isDirectory()){
                var fileName = path_module.basename(f);
                var suffix = '.controller.js';
                var apiName = fileName.substring(0, fileName.length - suffix.length);
                if (apiName != '' && (apiName + suffix) == fileName) {
                    if(protectedFields[apiName]==undefined){
                        protectedFields[apiName]=protectedFields.standart;
                    }
                    apiv1[apiName] = require(f);
                    mrutil.console('api ' + apiName.blue + ' loaded.');
                }
            }
        }
        cb(null);
    }catch(e){
        cb(e);
    }
}



function LoadRepoModules(cb) {
    try{
        var DIR = path_module.join(__dirname, '../api.v1/repo');
        var files=fs.readdirSync(DIR);

        var f, l = files.length;
        for (var i = 0; i < l; i++) {
            f = path_module.join(DIR, files[i]);
            if(!fs.statSync(f).isDirectory()){
                var fileName = path_module.basename(f);
                var suffix = '.controller.js';
                var apiName = fileName.substring(0, fileName.length - suffix.length);
                if (apiName != '' && (apiName + suffix) == fileName) {
                    apiv1_repo[apiName] = require(f);
                    if(protectedFields[apiName]==undefined){
                        protectedFields[apiName]=protectedFields.standart;
                    }
                    mrutil.console('api repo ' + apiName.blue + ' loaded.');
                }
            }
        }
        cb(null);
    }catch(e){
        cb(e);
    }
}

function LoadSystemModules(cb) {
    try{
        var DIR = path_module.join(__dirname, '../api.v1/system');
        var files=fs.readdirSync(DIR);

        var f, l = files.length;
        for (var i = 0; i < l; i++) {
            f = path_module.join(DIR, files[i]);
            if(!fs.statSync(f).isDirectory()){
                var fileName = path_module.basename(f);
                var suffix = '.controller.js';
                var apiName = fileName.substring(0, fileName.length - suffix.length);
                if (apiName != '' && (apiName + suffix) == fileName) {
                    apiv1_system[apiName] = require(f);
                    if(protectedFields[apiName]==undefined){
                        protectedFields[apiName]=protectedFields.standart;
                    }
                    mrutil.console('api system ' + apiName.blue + ' loaded.');
                }
            }
        }
        cb(null);
    }catch(e){
        cb(e);
    }
}
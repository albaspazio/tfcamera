//      /storage/emulated/0/Android/data/com.ionicframework.allspeak/files/audio_sentences


function FileSystemSrv($cordovaFile, $ionicPopup, $q, StringSrv)
{
    var service                         = {}; 
    service.output_data_root            = "";
    service.resolved_output_data_root   = "";

    // =========================================================================
    // FILES
    // =========================================================================    
    // invoke the success callback (then) returning 1 or 0 instead of invoking the success or error callbacks
    service.existFile = function(relative_path)
    {
        return $cordovaFile.checkFile(service.resolved_output_data_root, relative_path)
        .then(function (success) {
            return 1;  
        })
        .catch(function (error)   {
            return $q.resolve(0);
        });        
    };
    
    //--------------------------------------------------------------------------
    service.readJSON = function(relative_path)
    {
        return $cordovaFile.readAsText(service.resolved_output_data_root, relative_path)
        .then(function (content) {
            return JSON.parse(content);  
        })
        .catch(function (error)   {
            return $q.reject(error);
        });        
    };
    
    //--------------------------------------------------------------------------
    // OVERWRITING
    // 2 : overwrite explicitly set to true  => do ovewrite
    // 1 : overwrite not specified           => ask if can overwrite
    // 0 : overwrite explicitly set to false => doesn't ovewrite
    //--------------------------------------------------------------------------
    service.createFile = function(relative_path, content, overwrite)
    {
        var _overwrite = 1; // default behaviour: ask before overwriting
        
        if(overwrite != null){
            if(overwrite)   _overwrite = 2;
            else            _overwrite = 0;
        }
        
        // already exist?
        return service.existFile(relative_path)
        .then(function(exist){
            if(exist){ // exist...see if can overwrite
                switch (_overwrite){
                    case 2:
                        // overwrite
                        return service.overwriteFile(relative_path, content);
                        
                    case 1:
                        // prompt for overwrite permissions
                        $ionicPopup.confirm({ title: 'Attenzione', template: 'File already exist, do you want to overwrite it?'})
                        .then(function(res) 
                        {
                            if(res)     return service.overwriteFile(relative_path, content);               
                            else        return 1;
                        });
                }
            }
            else    return service.saveFile(relative_path, content); // file doesn't exist => save it
        });
    };
    
    //--------------------------------------------------------------------------
    // BUG !!!!! only works if file doesn't exist...
    // so is called by createFile after having checked that the file doesn't exist
    service.saveFile = function(relative_path, content)
    {
        return $cordovaFile.writeFile(service.resolved_output_data_root, relative_path, content, 1)
        .then(function(){
            console.log("created file " + service.resolved_output_data_root + relative_path);
            return 1;
        })
        .catch(function(error){
            console.log("FileSystemSrv::saveFile" + JSON.stringify(error));            
            return $q.reject(error);
        });
    };    
    
    //--------------------------------------------------------------------------
    // patch....first delete the file and then call saveFile
    // the error raises at line 104 of the DirectoryEntry.js file in the function DirectoryEntry.prototype.getFile
    service.overwriteFile = function(relative_path, content)
    {
        return $cordovaFile.removeFile(service.resolved_output_data_root, relative_path)
        .then(function(){
           return service.saveFile(relative_path, content); 
        })
        .catch(function(error){
            console.log("FileSystemSrv::overwriteFile" + JSON.stringify(error));            
            return $q.reject(error);
        });
//        return $cordovaFile.writeExistingFile(service.resolved_output_data_root, relative_path, content)
//        .then(function(){ return 1;}).catch(function(error){ console.log(error.message);  return $q.reject(error);  });
    };    
    //--------------------------------------------------------------------------
    service.deleteFile = function(relative_path)
    {
        return $cordovaFile.removeFile(service.resolved_output_data_root, relative_path)
        .then(function(success){
            return success;
        })
        .catch(function(error){
            console.log("FileSystemSrv::deleteFile" + JSON.stringify(error));            
            return $q.reject(error);
        });
    };
    
    // =========================================================================
    // DIRECTORIES
    // =========================================================================    
    service.createDir = function(relative_path, force)
    {
        if (!force)
        {
            return $cordovaFile.checkDir(service.resolved_output_data_root, relative_path)
            .then(function (success) {return 1;})
            .catch(function (error){
                $cordovaFile.createDir(service.resolved_output_data_root, relative_path, true)
                .then(function (success) {
                    if (success) {
                        console.log("created directory", service.resolved_output_data_root+ relative_path);
                        return 1;
                    }
                })
                .catch(function (error) {
                    console.log("FileSystemSrv::createDir" + JSON.stringify(error));            
                    return $q.reject(error);
                });      
            });   
        }
        else
        {
            $cordovaFile.createDir(service.resolved_output_data_root, relative_path, true)
            .then(function (success) {
                if (success) {
                    console.log("created directory", service.resolved_output_data_root+ relative_path);
                    return 1;
                }
            })
            .catch(function(error){
                console.log("FileSystemSrv::createDir" + JSON.stringify(error));            
                return $q.reject(error);
            });            
        }
    };    
    
    //--------------------------------------------------------------------------
    service.listDir = function(relative_path, valid_extensions)
    {
        return $cordovaFile.listDir(service.resolved_output_data_root, relative_path)
        .then(function(dirs){
            return dirs;
        })
        .catch(function(error){
            console.log("FileSystemSrv::listDir" + JSON.stringify(error));            
            return $q.reject(error);
        });
    };
    
    //--------------------------------------------------------------------------
    //return all the files contained in a folder, belonging to the [valid_extensions] formats.
    service.listFilesInDir = function(relative_path, valid_extensions)
    {
        var len_ext = 0;
        if(valid_extensions != null) len_ext = valid_extensions.length;
        
        return $cordovaFile.listDir(service.resolved_output_data_root, relative_path)
        .then(function(dirs)
        {
            var len = dirs.length;
            var arr = [];
            var cnt = 0;
            for (d=0; d<len; d++)
            {
                if (!dirs[d].isDirectory)
                {
                    var insert = false;
                    if(len_ext)
                    {
                        // filter input files: show only some extensions
                        var ext = StringSrv.getExtension(dirs[d].name);
                        for (e=0; e<valid_extensions.length; e++)
                        {    
                            if( ext == valid_extensions[e])
                            {
                                insert = true; 
                                break;
                            }
                        }
                    }
                    else insert = true;
                    if(insert)
                    {
                        arr[cnt] = dirs[d].name;
                        cnt++;
                    }
                }
            }
            return arr;            
        })
        .catch(function(error){
            console.log(error.message);
            return $q.reject(error);
        });
    };
    
    //--------------------------------------------------------------------------
    service.deleteDir = function(relative_path)
    {
        return $cordovaFile.removeRecursively(service.resolved_output_data_root, relative_path)
        .then(function(success){
            console.log("Deleted folder " + relative_path);
            return success;
        })
        .catch(function(error){
            return $q.reject(error);
        });
    };
    
    // =========================================================================
    // ACCESSORY
    // =========================================================================
    service.showConfirm = function(title, text) 
    {
        return confirmPopup = $ionicPopup.confirm({
            title: title,
            template: text
        });
        confirmPopup.then(function(res) {
            return res;
        });
    };
    
    service.removeExtension = function(fullname)
    {
        var arr = fullname.split(".");
        arr.splice(-1,1);
        arr.join(".");
        return arr;
    };

    service.setUnresolvedOutDataFolder = function(unresolved)
    {
        service.output_data_root            = unresolved ;
        service.resolved_output_data_root   = cordova.file[service.output_data_root];
        return service.resolved_output_data_root;
    };        
    
    service.getResolvedOutDataFolder = function()
    {
        return service.resolved_output_data_root;
    };    
    // =========================================================================
    return service;
}

 main_module.service('FileSystemSrv', FileSystemSrv);

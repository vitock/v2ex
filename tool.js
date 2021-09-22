const CryptoJS = require("crypto-js")
const UUID = require("uuid")
const path = require('path')
const fs = require('fs')
const keysalt = 'ec2a69afa5c57776b0dd9ed5f4f0438a'
const ivSalt = 'lPc1lE3M'
const zlib = require('zlib')


function decrypt(message,key){
    key = CryptoJS.HmacSHA256(key,keysalt).toString(CryptoJS.enc.Base64);
    var k = CryptoJS.enc.Base64.parse(key);
    var iv = CryptoJS.HmacSHA256(key,ivSalt)
    let r = CryptoJS.AES.decrypt(message,k,{mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,iv:iv});
    if(r.sigBytes > 0){
        let resultb64 =  r.toString(CryptoJS.enc.Base64);
        var buffResult = Buffer.from(resultb64,'base64');
        if (buffResult.length > 32) {
            buffResult = buffResult.slice(32);
            if (buffResult.length) {
                buffResult = zlib.gunzipSync(buffResult);
                return buffResult.toString('utf-8'); 
            }
               
        }
    }
    return null;
}

function encrypt(message,key){
    key = CryptoJS.HmacSHA256(key,keysalt).toString(CryptoJS.enc.Base64);
    var msgBuffer = Buffer.from(message,'utf-8');
    msgBuffer = zlib.gzipSync(msgBuffer)

    var sha2 = CryptoJS.SHA256(message).toString(CryptoJS.enc.Base64);
    var buffSha2 = Buffer.from(sha2,'base64');
    var bufferToEncrypt  = Buffer.concat([buffSha2,msgBuffer])

 
    var m = CryptoJS.enc.Base64.parse(bufferToEncrypt.toString('base64'));
    var iv = CryptoJS.HmacSHA256(key,ivSalt)
    var k = CryptoJS.enc.Base64.parse(key);
    let r =  CryptoJS.AES.encrypt(m ,k,{mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7,iv:iv});

    return r.toString();
}

var g_config = null;
function getConfig(){
    try {
        if(g_config){
            return g_config
        }
        let encpath = path.join(process.cwd(), "encfiles/config.json.enc");
        let enc2 = fs.readFileSync(encpath).toString();
        var key = process.env.ENCKEY
        if (!key && fs.existsSync(path.join(process.cwd(), "secretFiles/config-dont-push.json"))) {
            let filepath = path.join(process.cwd(), "secretFiles/config-dont-push.json");
            let plain = fs.readFileSync(filepath).toString();
            key = JSON.parse(plain).ENCKEY ;
            console.error(`
            /*********************************************
                No  process.env.ENCKEY
                Read key from config-dont-push.json
            ********************************************/
            `);
        }


        if (!key) {
            console.error(`
            /*********************************************
                No  process.env.ENCKEY
            ********************************************/
            `);
            process.exit(1);
        }
        let p = decrypt(enc2,key)
        g_config = JSON.parse(p);
        return g_config;
    } catch (error) {
       
    }
   
}
function saveConfig(){
    var config = g_config;
    const key = process.env.ENCKEY || g_config.ENCKEY ;
    if (!key) {
        console.log()
        return;
    }
    if(!config.ENCKEY){
        config.ENCKEY = key;
        plain = JSON.stringify(config,null,5);
        fs.writeFileSync(filepath,plain);
    }else{
    }
    var plain = JSON.stringify(g_config);
     
    let enc = encrypt(plain,key);
    console.log(`
    Encryption len:${enc.length}:  ${enc.substr(0,10)} ... ${enc.substr(enc.length - 10,10)}
    `);
    let encpath = path.join(process.cwd(), "encfiles/config.json.enc");
    fs.writeFileSync(encpath ,enc );
    var plainpath = path.join(process.cwd(), "secretFiles/config-dont-push.json");
    if(fs.existsSync(plainpath)){
        let plain = JSON.stringify(config,null,'\t');
        fs.writeFileSync(plainpath ,plain );
    }else{

    }
}

if (require.main === module) {
    let filepath = path.join(process.cwd(), "secretFiles/config-dont-push.json");
    let plain = fs.readFileSync(filepath).toString();
    let config = JSON.parse(plain);
    g_config = config;
    const key = config.ENCKEY ||  UUID.v4().replace(/-/g,'');
    // process.env.ENCKEY = key;
    if(!config.ENCKEY){
        config.ENCKEY = key;
        plain = JSON.stringify(config,null,5);
        fs.writeFileSync(filepath,plain);

        console.log(`
        生成随机加密密码,请保存:' +${key}
        `)
    }else{
        console.log(`
        配置加密密码:${key}
        `)
    }
    saveConfig();
    console.log(getConfig())
    
} else {
}


function  wait(sec){
    return new Promise(r=>{
        setTimeout(() => {
            r(1);
        }, sec * 1000);
    })
}
module.exports = {getConfig,saveConfig,encrypt,decrypt,wait}
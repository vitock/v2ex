const axios = require("axios");
const tool = require("./tool.js");

// create the socksAgent for axios
var httpsAgent = undefined;
console.log(process.argv);
if (process.argv[2] == "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  const SocksProxyAgent = require("socks-proxy-agent"); // replace with your proxy's hostname and port
  const proxyHost = "127.0.0.1",
    proxyPort = "1086";
  // the full socks5 address
  const proxyOptions = `socks5://${proxyHost}:${proxyPort}`;
  httpsAgent = new SocksProxyAgent(proxyOptions);
  console.log("proxy:", proxyOptions);
}

const Config = tool.getConfig() || process.env;

const cookie = Config.V2EXCK;
const fs = require("fs");
const qmsgapi = Config.QMSGAPI;
once = null;
ckstatus = 1;
signstatus = 0;
// time = new Date();
// tmpHours = time.getHours();time.setHours(tmpHours + 8);

let beijin = new Date(new Date().getTime() + 480 * 60 * 1000);
notice = beijin.toISOString().replace("T", " ").replace("Z", "");
const header = {
  timeout: 6000,
  httpsAgent: httpsAgent,
  withCredentials: true,
  headers: {
    Referer: "https://www.v2ex.com/mission",
    // Host: "www.v2ex.com",
    "user-agent":
      "Mozilla/5.0 (Linux; Android 10; Redmi K30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.83 Mobile Safari/537.36",
    cookie: `${cookie}`,
  },
};

function updateCookie(set_cookes_arr){
    var OriCookieArr =  Config.V2EXCK.split(';')
    if(set_cookes_arr){
        var cookieChange = false;
        set_cookes_arr.map(e=>{
            var key = e.split('=')[0];
            if (/V2EX_LANG/.test(key)) {
                console.log('333');
                return;
            }
            for (let index = 0; index < OriCookieArr.length; index++) {
                const e2 = OriCookieArr[index];
                var key2 = e2.split('=')[0];
                key2 = key2.replace(/^ */,'');
                if (key2 == key) {
                    console.log('update cookie',key);
                    OriCookieArr[index] = e.split(';')[0];
                    cookieChange = true;
                    break;
                }
                
            }
         
        })

        Config.V2EXCK = OriCookieArr.join(';');
        header.headers.cookie = Config.V2EXCK;
        if(cookieChange){
            tool.saveConfig();
        }
        
    }
}

//??????once?????????????????????
async function check() {
   
    try {
      let url = "https://www.v2ex.com/mission/daily";
      let res = await axios.get(url, header);

      updateCookie(res.headers['set-cookie']);
      reg1 = /???????????????/;
      if (reg1.test(res.data)) {
        console.log("cookie??????1");
        ckstatus = 0;
        notice += "cookie??????2";
      } else {
        reg = /???????????????????????????/;
        if (reg.test(res.data)) {
          notice += "????????????????????????\n";
          signstatus = 1;
        } else {
          reg = /redeem\?once=(.*?)'/;
          once = res.data.match(reg)[1];
          console.log(`???????????? once:${once}`);
        }
      }
    } catch (err) {
      console.log("Err 56");
    }

}
async function qmsg(msg){
  await tool.qmsg(msg);
}
//????????????
async function daily() {
  try {
    let url = `https://www.v2ex.com/mission/daily/redeem?once=${once}`;
    let res = await axios.get(url, header);
    console.log(once);
    reg = /?????????????????????????????????/;
    if (reg.test(res.data)) {
      notice += "????????????\n";
      signstatus = 1;
    } else {
      notice += "????????????\n";
    }
  } catch (err) {
    console.log("Errror 76", err);
  }
}

//????????????
function balance() {
  return new Promise(async (resolve) => {
    try {
      let url = "https://www.v2ex.com/balance";
      let res = await axios.get(url, header);
      reg = /\d+?\s?????????????????????\s\d+\s??????/;
      console.log(res.data.match(reg)[0]);
      notice += res.data.match(reg)[0];
    } catch (err) {
      console.log("Error 93");
    }
    resolve();
  });
}

//????????????


async function sign() {
  try {
    if (!cookie) {
      console.log("??????cookie????????????");
      await qmsg("??????cookie????????????");
      return;
    }
    await check();
    if (ckstatus == 1) {
      if (once && signstatus == 0) {
        await daily();
        if (signstatus == 0) {
          //??????????????????
          await check();
          await daily();
        }
      }
      await balance();
    } else {
    }
    console.log(notice);
    await qmsg(notice);
  } catch (err) {
    console.log("Err183", err);
  }
}

console.log(`




**************************************************
*
*
*   ${new Date(Date.now() + 8 * 3600000).toISOString().replace(/T|Z/g," ")}
*
*
**************************************************




`)

!(async function () {
  var timecount = tool.wait(60 * 6);
  await Promise.race([sign(), timecount]);
  console.log("finish");
  process.exit(0);
})();

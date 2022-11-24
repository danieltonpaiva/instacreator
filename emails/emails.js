async function waitElement(page, element, timeout, tentativas) {
    let i = 0;
    let x =  await page.evaluate((el) => {
        if(document.querySelector(el))
            return true;
        else
            return false;
    }, element);   
    while(i < timeout && x == false){
        await wait(1);
        i++;
        x = await page.evaluate((el) => {
                if(document.querySelector(el))
                    return true;
                else
                    return false;
            }, element);
    }
    
    if(x){
        return new Promise((resolve) => {
            resolve(true);
        });
    }else{
        if(tentativas > 0){
            createSpan('Tentando encontrar elemento ' + element + '...');
            await page.reload();
            return await waitElement(page, element, timeout, tentativas-1);
        }else{
            return new Promise((resolve, reject) => {
                reject('Erro! Tentativas excedidas! SELECTOR: ' + element);
            })
        }
    }
}

async function getElementByText(page, text='Email', t=3) {
	if(t >= 0){
		var div = await page.evaluate((text) => {
			let span = document.querySelectorAll('span');
			for (var i = 0; i < span.length; i++) {
				if(span[i].innerText.toUpperCase() == text.toUpperCase()){
					span[i].click();
					return true;
				}
			}
			return false;
		}, text)
		if(div){
			return true;
		}else{
			await wait(1);
			return await getElementByText(page, text, t-1);
		}
	}else{
		return false;
	}
}

async function acceptCookies(page, t = 1) {
	if(t < 5){
		if(await page.evaluate(() => document.querySelectorAll('._acan._acap._acaq._acas._acav').length) > 0){
			let cook = await page.evaluate(() => {
				var b = document.querySelectorAll('._acan._acap._acaq._acas._acav');
				for (var i = 0; i < b.length; i++) {
					if(b[i].innerText == 'Allow essential and optional cookies'){
						b[i].click();
						return true;
					}
				}
				return false;
			})
			if(cook){
				console.log("Cookies detectado!");
				await wait(3);
				console.log("Cookies aceitos!");
				return acceptCookies(page, t+1);
			}else{
				return acceptCookies(page, t+1);
			}				
		}else{
			return true;
		}
	}else{
		return false;
	}
}

async function wait(timeout=5) {
  return new Promise((resolve) => {
    var n = 0;
    setInterval(() => {
      n++;
      if(n >= timeout){
        resolve();
            }
    }, 1000);
  })
}

async function changeUrl(page, t=30, cr=false){
    var urlOriginal = await page.url();
    let url, u;
    let n = 0;
    return new Promise((resolve) => {
    	n++;
        let temp = setInterval(async () => {
            url = await page.url();
            if(url !== urlOriginal){
                console.log('Url changed!');
                resolve(true);
                clearInterval(temp);
            }
            if(n >= t){
            	reject(false);
            	clearInterval(temp);
            }
        }, 1000)
    })
}

async function selectData(page, t = 0) {
    try{
        let d = await page.evaluate(() => {
            if(document.querySelector('select[title="Year:"]'))
                return true;
            else
                return false;
        })
        if(d){
            console.log('Preenchendo a data');
            await page.hover('select[title="Year:"]');
            await page.click('select[title="Year:"]');
            await wait(1);
            await page.evaluate(() => {
                if(document.querySelector('select[title="Year:"]')){
                    document.querySelector('select[title="Year:"]').value = "2000"
                }
            });
            console.log('Selecionou o ano 2000');
            await wait(1);
            await page.hover('select[title="Year:"]');
            await page.click('select[title="Year:"]');
            await wait(1);
            await page.hover('body');
            await page.click('body');
            await wait(1);
            await page.click('._acan._acap._acas._acav');
            console.log('Clicou no botao data');
            await wait(5);        
        }
        d = await page.evaluate(() => {
            if(document.querySelector('select[title="Year:"]'))
                return true;
            else
                return false;
        })
        if(d){
            if(t <= 5){
                console.log('Tentando novamente...');
                return await selectData(page, t+1);
            }else{
            	reject("Falha ao registrar data");
            }
        }else{
            return new Promise((resolve) => {
                resolve(true);
            })
        }
    }catch(err){
            return new Promise((resolve) => {
                resolve(err);
            })
    }
}

async function tempail(page, type) {
	if(type == 'email'){
   		await page.goto('https://tempail.com/en/', {waitUntil: 'load'})
		console.log("Tempail carregado");
		await page.waitForSelector('#eposta_adres', {timeout: 240000})
	    var email = await page.evaluate(() => {
	        if(document.querySelector('#eposta_adres')){
	            return document.querySelector('#eposta_adres').value;
	        }else{
	            return false;
	        }
	    })
	    if(email){
	    	console.log("Email gerado: " + email);
	    	return email;
	    }else{
	    	return false;
	    }	
	   }else if(type == 'code'){
			await waitElement(page, '.mail', 35, 1);
            var code = await page.evaluate(() => document.querySelectorAll('ul li.mail')[0].querySelector('.baslik').innerText);
            code = code.split(' ')[0];
            page.close();
            return code;
	   }
}

async function contasInfinity(page, type) {
	if(type == 'email'){
   		await page.goto('https://email.contasinfinity.com.br/mailbox', {waitUntil: 'load'})
		console.log("ContasInfinity carregado");
		await page.waitForSelector('#email_id', {timeout: 240000});
        var email = await page.evaluate(() => {
            if(document.querySelector('#email_id')){
                return document.querySelector('#email_id').innerText;
            }else{
                return false;
            }
        })
	    if(email){
	    	console.log("Email gerado: " + email);
	    	return email;
	    }else{
	    	return false;
	    }	
	   }else if(type == 'code'){
			await waitElement(page, '.flex.items-center.gap-3', 90, 2);
            var code = await page.evaluate(() => document.querySelectorAll('.flex.items-center.gap-3')[1].innerText);
            code = code.split('\n')[2].split(' ')[0];
            page.close();
            return code;
	   }
}

module.exports.waitElement = waitElement;
module.exports.getElementByText = getElementByText;
module.exports.wait = wait;
module.exports.selectData = selectData;
module.exports.changeUrl = changeUrl;
module.exports.acceptCookies = acceptCookies;

module.exports.tempail = tempail;
module.exports.contasInfinity = contasInfinity;
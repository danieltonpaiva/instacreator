const puppeteer = require('puppeteer');
require('dotenv').config();
const fs = require('fs');
const names = require('gerador-nome');
var { tempail, contasInfinity, waitElement, getElementByText, wait, selectData, changeUrl, acceptCookies } = require('./emails/emails.js');
var dialogo = false;

function random(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

async function getElement(page, element) {
	var el = await page.evaluate((element) => {
		return document.querySelector(element) ? true : false;
	}, element)
	return el;
}

async function generateUsername() {
	function retira_acentos(str) {
		com_acento = "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝŔÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿŕ";
		sem_acento = "AAAAAAACEEEEIIIIDNOOOOOOUUUUYRsBaaaaaaaceeeeiiiionoooooouuuuybyr";
	    novastr="";
	    for(i=0; i<str.length; i++) {
	        troca=false;
	        for (a=0; a<com_acento.length; a++) {
	            if (str.substr(i,1)==com_acento.substr(a,1)) {
	                novastr+=sem_acento.substr(a,1);
	                troca=true;
	                break;
	            }
	        }
	        if (troca==false) {
	            novastr+=str.substr(i,1);
	        }
	    }
	    return novastr;
	}

    let sobrenomes = fs.readFileSync('files/sobrenomes.txt', 'utf8');
    sobrenomes = sobrenomes.split('\r\n');
    let sobrenome = sobrenomes[random(0, sobrenomes.length-1)];
    let nome = retira_acentos(names.geradorNomeFeminino());
    sobrenome = retira_acentos(sobrenome);
    username = nome + '_' + sobrenome + sobrenome[sobrenome.length-1] + sobrenome[sobrenome.length-1] + random(10, 59);
    username = username.replace(/ /g, '');
    username = username.replace("'", '');
    username = username.replace("-", '');
    username = username.replace("\n", '');
    username = username.toLowerCase();
    return {sobrenome, nome, username}
}

async function createAccount(emailType) {
	var {sobrenome, nome, username} = await generateUsername();
	nome[0].toUpperCase();
	sobrenome[0].toUpperCase();

	console.log("Iniciando criação de conta")
	console.log("Nome: " + nome + ' ' + sobrenome);
	console.log("Username: @" + username);

	const browser = await puppeteer.launch({headless: false})
	var page = await browser.newPage();
	await page.emulate(puppeteer.devices['iPhone 7']);
	await page.setDefaultNavigationTimeout(0);
    page.on('dialog', async dialog => {
            if(dialogo){
                 console.log('Dialog accepted!')
                await dialog.accept();
            }else{
                console.log('Dialog rejected!')
                await dialog.dismiss();
            }

    })
	await page.goto('https://www.instagram.com/accounts/signup/phone')
	await acceptCookies(page);
	await wait(1);
   	await getElementByText(page, 'Email', 0)
   	await page.waitForSelector('input[type="email"]', {timeout: 10000});
   	var page2 = await browser.newPage();
   	let email;
   	switch(emailType){
   		case 'contasInfinity':
   			email = await contasInfinity(page2, 'email');
   			break;
   		case 'tempail':
   			email = await tempail(page2, 'email');
   			break;
   	}
   	await page.bringToFront();
    await page.type('input[type="email"]', email);
    await wait(2);
    await page.click(process.env.BUTTON_NEXT);
    await wait(3);
    if(await getElement(page, 'input[type="email"]')){
    	console.log("Falha ao registrar email");
    	return;
    }
    console.log("Esperando codigo...");
    await page2.bringToFront();
    let code;
   	switch(emailType){
   		case 'contasInfinity':
   			code = await contasInfinity(page2, 'code');
   			break;
   		case 'tempail':
   			code = await tempail(page2, 'code');
   			break;
   	}
    console.log("Codigo encontrado: " + code);
    await page.bringToFront();
    await page.type('input[type="text"]', code);
    await wait(2);
    await page.click(process.env.BUTTON_NEXT);
    console.log('Codigo inserido');
    await page.waitForSelector('input[name="fullName"]', {timeout: 30000});
    console.log('Preenchendo o nome e senha...');
    await page.type('input[name="fullName"]', nome + ' ' + sobrenome);
    await page.type('input[name="password"]', '199722112');
    await wait(1);
    await page.click(process.env.BUTTON_NEXT);
    await page.waitForSelector('select[title="Year:"]', {timeout: 30000});
    await selectData(page, 0);
    await page.waitForSelector('._ae04', {timeout: 240000});
    var user = await page.evaluate(() => document.querySelector('._ae04').innerText.split(',')[1].replace(' ', ''));
    if(user == username){
        console.log('usernames match!');
    }else{
        await wait(2);
        await page.click('._ae06._acan._acao._acas');
        await page.waitForSelector('input[type="text"]', {timeout: 240000});
        console.log('Gerando username');
        await page.evaluate(() => document.querySelector('input[type="text"]').value = "");
        await wait(1);
        let inp = await page.evaluate(() => document.querySelector('input[type="text"]').value);
        while(inp !== ""){
            console.log('Nao apagou o nome!!!!');
            await page.evaluate(() => document.querySelector('input[type="text"]').value = "");
            await wait(2);
            inp = await page.evaluate(() => document.querySelector('input[type="text"]').value);
        }
        await page.type('input[type="text"]', username);
        await wait(1);              
    }
    await page.click(process.env.BUTTON_NEXT);
    console.log("Criando conta @" + username);
	await wait(3);
    dialogo = true;
    await changeUrl(page, 30);
    if(await page.url().indexOf('challenge') > 0){
    	console.log("Sua conta não foi criada :(")
    }else{
    	console.log("Conta criada com sucesso!");
    }
}

(async () => {
	await createAccount('tempail');
})();
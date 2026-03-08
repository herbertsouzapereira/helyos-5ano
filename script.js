const perguntas = [

{
pergunta:"Qual movimento da Terra cria o dia e a noite?",
opcoes:["Translação","Rotação","Inclinação","Precessão"],
correta:1
},

{
pergunta:"Qual movimento cria as estações do ano?",
opcoes:["Rotação","Translação","Gravidade","Magnetismo"],
correta:1
},

{
pergunta:"Quanto dura aproximadamente a rotação da Terra?",
opcoes:["24 horas","12 horas","48 horas","30 horas"],
correta:0
},

{
pergunta:"O eixo da Terra é considerado:",
opcoes:["Linha imaginária","Objeto sólido","Satélite","Montanha"],
correta:0
},

{
pergunta:"A translação ocorre ao redor de qual astro?",
opcoes:["Lua","Sol","Marte","Júpiter"],
correta:1
},

{
pergunta:"Quantas estações do ano existem?",
opcoes:["2","3","4","5"],
correta:2
},

{
pergunta:"Qual estação tem dias mais longos?",
opcoes:["Verão","Inverno","Outono","Primavera"],
correta:0
},

{
pergunta:"Qual estação tem noites mais longas?",
opcoes:["Verão","Inverno","Primavera","Outono"],
correta:1
},

{
pergunta:"O equinócio ocorre quando:",
opcoes:[
"Dias e noites têm mesma duração",
"Dias são muito longos",
"Noites são muito longas",
"O sol desaparece"
],
correta:0
},

{
pergunta:"Cada estação dura aproximadamente:",
opcoes:["1 mês","2 meses","3 meses","6 meses"],
correta:2
}

]

let indice = 0
let pontos = 0

const perguntaEl = document.getElementById("pergunta")
const opcoesEl = document.getElementById("opcoes")
const pontuacaoEl = document.getElementById("pontuacao")
const feedbackImg = document.getElementById("feedbackImg")

function mostrarPergunta(){

feedbackImg.style.display="none"

let p = perguntas[indice]

perguntaEl.innerText = p.pergunta

opcoesEl.innerHTML=""

p.opcoes.forEach((opcao,i)=>{

let btn = document.createElement("button")

btn.innerText = opcao

btn.onclick=()=>responder(i)

opcoesEl.appendChild(btn)

})

pontuacaoEl.innerText = "Pontuação: " + pontos

}

function responder(i){

let correta = perguntas[indice].correta

if(i === correta){

pontos++

feedbackImg.src="capivaraAcerto.png"

}else{

feedbackImg.src="capivaraErro.png"

}

feedbackImg.style.display="block"

setTimeout(()=>{

indice++

if(indice < perguntas.length){

mostrarPergunta()

}else{

mostrarFinal()

}

},1500)

}

function mostrarFinal(){

perguntaEl.innerText="🎉 Revisão concluída!"

opcoesEl.innerHTML=""

feedbackImg.style.display="none"

pontuacaoEl.innerHTML="Pontuação final: " + pontos + " / " + perguntas.length

}

mostrarPergunta()

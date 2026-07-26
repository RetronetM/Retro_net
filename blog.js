let posts = [];

const postsContainer = document.getElementById("posts");
const titleInput = document.getElementById("postTitle");
const textInput = document.getElementById("postText");


// SEGURANÇA
function escapeHtml(text){
    return String(text ?? "")
        .replace(/&/g,"&amp;")
        .replace(/</g,"&lt;")
        .replace(/>/g,"&gt;")
        .replace(/"/g,"&quot;")
        .replace(/'/g,"&#039;");
}


// USUÁRIO LOGADO
async function getUser(){

    const {
        data
    } = await supa.auth.getUser();

    return data.user || null;
}



// CRIAR POST
async function createPost(){

    const title = titleInput.value.trim();
    const content = textInput.value.trim();


    if(!title || !content){
        alert("Preencha tudo.");
        return;
    }


    const user = await getUser();


    if(!user){
        alert("Faça login.");
        return;
    }



    const {
        error
    } = await supa
    .from("posts")
    .insert({

        author:user.id,
        title:title,
        content:content,
        likes:0

    });



    if(error){

        alert(error.message);
        return;

    }


    titleInput.value="";
    textInput.value="";


    loadPosts();

}



// CARREGAR POSTS
async function loadPosts(){


    postsContainer.innerHTML=
    "Carregando...";



    const {
        data,
        error
    } = await supa
    .from("posts")
    .select("*")
    .order(
        "created_at",
        {
            ascending:false
        }
    );



    if(error){

        postsContainer.innerHTML=
        "Erro: "+error.message;

        return;

    }



    posts=data || [];


    renderPosts();

}




// MOSTRAR POSTS
function renderPosts(){


    if(posts.length===0){

        postsContainer.innerHTML=
        "Nenhum post.";

        return;

    }



    let html="";



    posts.forEach(post=>{


        html+=`

        <div class="card">


            <h2>
            ${escapeHtml(post.title)}
            </h2>


            <p>
            ${escapeHtml(post.content)}
            </p>


            <button
            class="button"
            onclick="likePost(${post.id})">

            ❤️ ${post.likes || 0}

            </button>


            <button
            class="button"
            onclick="toggleComments(${post.id})">

            💬 Comentários

            </button>


            <div
            id="comments-${post.id}"
            style="display:none">

            </div>


        </div>

        <br>

        `;


    });


    postsContainer.innerHTML=html;

}




// CURTIR
async function likePost(id){


    const post =
    posts.find(
        p=>p.id===id
    );


    if(!post)return;



    await supa
    .from("posts")
    .update({

        likes:(post.likes||0)+1

    })
    .eq(
        "id",
        id
    );


    loadPosts();

}




// COMENTÁRIOS
async function toggleComments(id){


    const box =
    document.getElementById(
        `comments-${id}`
    );


    if(box.style.display==="block"){

        box.style.display="none";
        return;

    }


    box.style.display="block";


    box.innerHTML="Carregando...";



    const {
        data
    } = await supa
    .from("comments")
    .select("*")
    .eq(
        "post_id",
        id
    );



    let html="";



    data.forEach(c=>{

        html+=`

        <p>
        💬 ${escapeHtml(c.text)}
        </p>

        `;

    });



    html+=`

    <textarea
    id="comment-${id}"
    placeholder="Comentário">
    </textarea>


    <button
    class="button"
    onclick="addComment(${id})">

    Enviar

    </button>

    `;



    box.innerHTML=html;


}



// ADICIONAR COMENTÁRIO
async function addComment(id){


    const input =
    document.getElementById(
        `comment-${id}`
    );


    const user =
    await getUser();



    if(!user)return;



    await supa
    .from("comments")
    .insert({

        post_id:id,
        author:user.id,
        text:input.value

    });



    toggleComments(id);

}



// INICIAR
document.addEventListener(
"DOMContentLoaded",
()=>{

    loadPosts();

});


window.createPost=createPost;
window.likePost=likePost;
window.toggleComments=toggleComments;
window.addComment=addComment;

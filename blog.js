let posts = [];

const postsContainer = document.getElementById("posts");
const titleInput = document.getElementById("postTitle");
const textInput = document.getElementById("postText");


function escapeHtml(text) {
    if (text === null || text === undefined) {
        return "";
    }

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


async function getCurrentUserId() {

    const {
        data,
        error
    } = await supa.auth.getUser();


    if (error || !data.user) {
        return null;
    }

    return data.user.id;
}



// CRIAR POST

async function createPost() {

    const title = titleInput.value.trim();
    const content = textInput.value.trim();


    if (!title || !content) {
        alert("Preencha o título e o conteúdo.");
        return;
    }


    const userId = await getCurrentUserId();


    if (!userId) {
        alert("Faça login para publicar.");
        return;
    }


    const {
        error
    } = await supa
        .from("posts")
        .insert({
            author: userId,
            title: title,
            content: content,
            likes: 0
        });


    if (error) {
        alert(error.message);
        return;
    }


    titleInput.value = "";
    textInput.value = "";


    loadPosts();
}





// CARREGAR POSTS

async function loadPosts() {


    postsContainer.innerHTML = `
        <div class="card">
            Carregando posts...
        </div>
    `;



    const {
        data,
        error
    } = await supa
        .from("posts")
        .select(`
            *,
            profiles(username)
        `)
        .order("created_at", {
            ascending:false
        });



    if(error){

        postsContainer.innerHTML = `
            <div class="card">
                Erro ao carregar posts.
            </div>
        `;

        console.log(error);

        return;
    }



    posts = data || [];


    renderPosts();

}





// MOSTRAR POSTS

function renderPosts(){


    if(posts.length === 0){

        postsContainer.innerHTML = `
            <div class="card">
                Nenhum post encontrado.
            </div>
        `;

        return;
    }



    let html = "";



    posts.forEach(post => {


        const username =
            post.profiles?.username ||
            "Usuário";



        const date =
            new Date(post.created_at)
            .toLocaleString("pt-BR");



        html += `

        <div class="card">


            <h2>
                ${escapeHtml(post.title)}
            </h2>



            <p>
                <strong>
                    ${escapeHtml(username)}
                </strong>
            </p>



            <small>
                ${date}
            </small>



            <br><br>



            <p>
                ${escapeHtml(post.content)}
            </p>



            <br>



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
            style="display:none;margin-top:20px;">

            </div>


        </div>

        <br>

        `;


    });



    postsContainer.innerHTML = html;


}





// CURTIR POST

async function likePost(postId){


    const post =
    posts.find(
        item => item.id === postId
    );



    if(!post){
        return;
    }



    const likes =
    Number(post.likes) || 0;



    const {
        error
    } = await supa
        .from("posts")
        .update({
            likes: likes + 1
        })
        .eq("id", postId);



    if(error){

        alert(error.message);
        return;

    }



    loadPosts();

}






// ABRIR COMENTÁRIOS

async function toggleComments(postId){


    const container =
    document.getElementById(
        `comments-${postId}`
    );



    if(!container){
        return;
    }



    if(container.style.display === "block"){

        container.style.display = "none";

        return;

    }



    container.style.display = "block";


    loadComments(postId);


}






// CARREGAR COMENTÁRIOS

async function loadComments(postId){


    const container =
    document.getElementById(
        `comments-${postId}`
    );



    container.innerHTML = `
        <p>
        Carregando comentários...
        </p>
    `;



    const {
        data,
        error
    } = await supa
        .from("comments")
        .select(`
            *,
            profiles(username)
        `)
        .eq("post_id",postId)
        .order("created_at",{
            ascending:true
        });



    if(error){

        container.innerHTML =
        "Erro ao carregar comentários.";

        return;
    }



    let html = "";



    if(!data || data.length === 0){

        html += `
        <p>
        Nenhum comentário.
        </p>
        `;

    }



    data.forEach(comment => {


        const username =
        comment.profiles?.username ||
        "Usuário";



        html += `

        <div class="card">

        <strong>
        ${escapeHtml(username)}
        </strong>

        <br><br>

        ${escapeHtml(comment.text)}

        </div>

        <br>

        `;


    });



    html += `

    <textarea
    id="commentText-${postId}"
    placeholder="Escreva um comentário..."
    rows="4"
    style="width:100%;">
    </textarea>


    <br><br>


    <button
    class="button"
    onclick="addComment(${postId})">

    Enviar

    </button>

    `;



    container.innerHTML = html;


}






// ADICIONAR COMENTÁRIO

async function addComment(postId){


    const input =
    document.getElementById(
        `commentText-${postId}`
    );



    const text =
    input.value.trim();



    if(!text){

        alert("Digite um comentário.");

        return;

    }



    const userId =
    await getCurrentUserId();



    if(!userId){

        alert("Faça login para comentar.");

        return;

    }



    const {
        error
    } = await supa
        .from("comments")
        .insert({

            post_id:postId,
            author:userId,
            text:text

        });



    if(error){

        alert(error.message);

        return;

    }



    input.value = "";


    loadComments(postId);


}






document.addEventListener(
"DOMContentLoaded",
()=>{

    loadPosts();

});



window.createPost = createPost;
window.likePost = likePost;
window.toggleComments = toggleComments;
window.addComment = addComment;
window.loadPosts = loadPosts;

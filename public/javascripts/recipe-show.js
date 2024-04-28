
const ingredients = document.querySelectorAll('#ingredient')
const firtsHeader = document.getElementById('first-header');
const secondHeader = document.getElementById('second-header');
const description = document.getElementById('description')
const backIcons = document.getElementById('back-icon')
const editIcon = document.getElementById('edit-icon')
const id = window.location.href.split('/').pop()

if (firtsHeader) {
    if (!secondHeader) {
        firtsHeader.classList.add('round-down')
    } else {
        firtsHeader.classList.remove('round-down')
    }
}
for (let i = 0; i < ingredients.length; i++) {
    if (i % 2 === 0) {
        ingredients[i].classList.add('bg-gray')
    } else {
        ingredients[i].classList.add('bg-light')
    }
    ingredients[0].classList.add('round-up')
    if (i === ingredients.length - 1 && ingredients[i].classList.contains('bg-light')) {
        description.classList.remove('bg-light')
        description.classList.add('bg-gray')
    }
}
if(backIcons){
    backIcons.onclick = () => {
        window.location.href = '/recipes'
    }
}

if (editIcon) {
    editIcon.onclick = () => {
        window.location.href = `/recipes/${id}/edit`
    }
}


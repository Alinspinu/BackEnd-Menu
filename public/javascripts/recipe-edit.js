
const addIngButton = document.querySelector(".addIngredient")
const ingContainer = document.querySelector("#ingContainer")
const icon = document.getElementById('back')
const id = window.location.href.split('/')[4];


icon.onclick = () => {
    window.location.href = `/recipes/${id}`
}

const removeButton = document.querySelectorAll('.removeIng')
removeButton.forEach(el => {
    el.onclick = (e) => {
        e.target.parentNode.remove()
    }
})


addIngButton.addEventListener('click', (event) => {
    const ingRow = createRow()
    ingContainer.append(ingRow)
    const removeButton = document.querySelectorAll('.removeIng')
    removeButton.forEach(el => {
        el.onclick = (e) => {
            e.target.parentNode.remove()
        }
    })
});


function createRow() {
    const ingRow = document.createElement('div')
    ingRow.classList.add('input-group', "mb-3")
    const ingRowHtml = ` 
      <input type="text" class="form-control" style="width:50%;" id="ingredient" placeholder="Ingredient" name="recipe[ingredients][name]" required>
      <input type="text" class="form-control" placeholder="Um" name="recipe[ingredients][um]" required>
      <input type="text" class="form-control" placeholder="Qty" name="recipe[ingredients][quantity]" required>
      <button type="button" class="btn bg-middle removeIng">x</button>`
    ingRow.innerHTML = ingRowHtml
    return ingRow
}
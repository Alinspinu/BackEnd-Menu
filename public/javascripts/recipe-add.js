const addIngButton = document.querySelector(".addIngredient")
const ingContainer = document.querySelector("#ingContainer")
const recipeSelector = document.querySelector('#selectCocktail')
const icon = document.getElementById('back')

icon.onclick = () => {
    window.location.href = '/recipes'
}

recipeSelector.addEventListener('change', () => {
    const selectedValue = recipeSelector.value
    const formContainer = document.querySelector('.form-container')
    const coffeeSetup = document.querySelector('.coffee-setup')
    const cocktailSetup = document.querySelector('.cocktail-setup')
    if (selectedValue === '1') {
        formContainer.classList.remove('hide')
        coffeeSetup.classList.remove('hide')
        cocktailSetup.classList.remove('hide')
    } else if (selectedValue === '2') {
        // const coffeeSetup = document.querySelector('.coffee-setup')
        formContainer.classList.remove('hide')
        coffeeSetup.classList.add('hide')
        cocktailSetup.classList.remove('hide')
    } else if (selectedValue === '3') {
        formContainer.classList.remove('hide')
        coffeeSetup.classList.add('hide')
        cocktailSetup.classList.add('hide')
    } else {
        formContainer.classList.add('hide')
        coffeeSetup.classList.add('hide')
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




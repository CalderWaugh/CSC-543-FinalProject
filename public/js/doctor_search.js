const search_doctors_btn = document.getElementById('search_doctors_btn');
const doc_results = document.getElementById('doc_results');

function searchDoctors() {
    let AJAX = new XMLHttpRequest(); //create AJAX object
  	AJAX.onerror = function() {  //attach error even handler
		alert("Network error");
	}
	AJAX.onload = function() {
        doc_results.innerHTML = '';
        if (this.status == 200) {
            JSON.parse(this.responseText).entries.forEach(element => {
                resultsP.innerHTML += `<tr><td>${element.name}</td></tr>`
            });;
        } else {
            alert("Network error");
        }
	}
    let url = `/search?name=${searchBox.value}`;
    console.log(url);
	AJAX.open("GET", url);
	AJAX.setRequestHeader("Content-type", "text/plain");
	AJAX.send();
};

search_doctors_btn.addEventListener('click', searchDoctors);
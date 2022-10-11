// jshint browser:true, eqeqeq:true, undef:true, devel:true, esversion: 8

// CONSTANTE QUI CONTIENT LE CHEMIN DU JSON
const JSON_FILE = "save.json";

// elt du dom
const BUTTONPLAY = document.getElementById("formButtonPlay");

// MAP
const SIDE_CASE = 20;
const EMPTY = 0;
const SNAKE = 1;
const FOOD = 2;
const WALL = 3;
let WORLD;


(function()
{
	BUTTONPLAY.addEventListener("click", play);

	/**
	 * @param 	{String} field 	Champs que l'on souhaite trouver dans le JSON
	 * @param 	{String} src   	Chemin vers le JSON
	 * @return 	{String}		Champs recherché dans le JSON
	 */
	function getFieldJSON(field, src)
	{
		fetch(src)
			.then((response) => response.json())
			.then((data) => {
				console.log(data.niveaux[0][field]);
				return data.niveaux[0][field];
			})
			.catch((error) => {
				console.error('Error :', error);
			});
	}	

	function play()
	{
		let sizeGrid = getFieldJSON("dimension", JSON_FILE);
		initGrid(sizeGrid);
	}

	function initGrid(sizeGrid)
	{
		let size = sizeGrid[0];
		for (let i = 0; i < size; i++)
		{
			for (let j = 0; j < size; j++)
			{
				WORLD[i][j] = EMPTY;
			}
		}
	}

})();
		

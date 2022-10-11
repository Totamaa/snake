// jshint browser:true, eqeqeq:true, undef:true, devel:true, esversion: 8

(function()
{
	// JSON
	const JSON_FILE = "save.json";
	
	// ELT DU DOM
	const BUTTONPLAY = document.getElementById("formButtonPlay");
	
	// MAP
	const SIDE_CASE = 20;
	const EMPTY = 0;
	const SNAKE = 1;
	const FOOD = 2;
	const WALL = 3;
	let WORLD;

	// SNAKE
	let SNAKEBODY;


	BUTTONPLAY.addEventListener("click", play);

	function play()
	{

		// init the game
		document.addEventListener("keydown", snakeDirection);

		let levelJson;
		(async function(){
			try
			{
				let jsonFile = await fetch(JSON_FILE);

				if (jsonFile.ok)
				{
					let levelChose = document.getElementById("level").value;
					let levels = jsonFile.json.levels;
					for (let level of levels)
					{
						if (level.level === levelChose)
						{
							levelJson = level;
						}
					}
				}
				else
				{
					throw("Err " + jsonFile.status);
				}
			}
			catch(e)
			{
				console.log(e);
			}
		})();
		initGrid(levelJson);
	}

	function initGrid(levelJson)
	{
		
		// empty grid
		let sizeGrid = levelJson.dimension;
		for (let i = 0; i < sizeGrid; i++)
		{
			for (let j = 0; j < sizeGrid; j++)
			{
				WORLD[i][j] = EMPTY;
			}
		}

		// walls
		let nbWall = levelJson.walls;
		for (let i = 0; i < nbWall; i++)
		{
			// case vide
			let x = Math.floor(Math.random() * sizeGrid);
			let y = Math.floor(Math.random() * sizeGrid);
			while (WORLD[x][y] !== EMPTY)
			{
				x = Math.floor(Math.random() * sizeGrid);
				y = Math.floor(Math.random() * sizeGrid);
			}

			WORLD[x][y] = WALL;
		}

		// apple
		generateApple();

		// snake
		let x = Math.floor(Math.random() * (sizeGrid - 2) + 1);
		let y = Math.floor(Math.random() * (sizeGrid - 2) + 1);
		
	}

	function moveDirection()
	{
		// TODO
	}

	function drawCanva()
	{
		// TODO
	}

	function generateApple()
	{
		// TODO
	}
})();
		

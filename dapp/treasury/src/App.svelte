<script>
	export let name;
</script>

<svelte:head>
	<title>Treasury</title>
</svelte:head>

<main>
	<h1>{name} Treasury</h1>
	<p>FInd out more at <a href="https://carbontoken.info">carbontoken.info</a></p>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
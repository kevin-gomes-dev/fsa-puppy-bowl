/**
 * @typedef Player
 * @property {number} id
 * @property {string} name Required in POST
 * @property {string} breed Required in POST
 * @property {string} status Enum: "bench" or "field"
 * @property {string} imageUrl
 * @property {number | null} teamId
 * @property {Team | null} team
 */

/**
 * @typedef Team
 * @property {number} id
 * @property {string} name
 * @property {number} score
 * @property {Player[]} players
 */

// === Constants ===
const BASE = "https://fsa-puppy-bowl.herokuapp.com/api";
const COHORT = "/2605-ftb-ct-web-pt-kevin";
const DEFAULT_COHORT = COHORT + "-base-data";
const PLAYER_RESOURCE = "/players";
const TEAM_RESOURCE = "/teams";
const API = BASE + COHORT;

// === State ===
let players = [];
let teams = [];
let selectedPlayer;

// === Data ===
/**
 * Gets all players and stores in state var
 */
async function getPlayers(url = API + PLAYER_RESOURCE) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    players = data.data.players;
    players.sort((playerA, playerB) => {
      return playerA.name.localeCompare(playerB.name);
    });
    render();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Gets all teams and stores in state var
 */
async function getTeams() {
  try {
    const res = await fetch(API + TEAM_RESOURCE);
    const data = await res.json();
    teams = data.data.teams;
    render();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Sets the selected player state var by getting player with given id from API
 * @param {number} id
 */
async function setSelectedPlayer(id, url = API + PLAYER_RESOURCE) {
  try {
    const res = await fetch(url + "/" + id);
    const data = await res.json();
    selectedPlayer = data.data.player;
    render();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Adds a player using POST before doing a GET to update state
 * @param {Player} player
 */
async function addPlayer(player) {
  try {
    await fetch(API + PLAYER_RESOURCE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(player),
    });
    getPlayers();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Deletes player at specified id before doing a GET to update state
 * @param {number} id
 */
async function deletePlayer(id) {
  try {
    await fetch(API + PLAYER_RESOURCE + "/" + id, {
      method: "DELETE",
    });
    getPlayers();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Resets all data, deleteing everything and adding back initial data
 */
async function resetData() {
  const input = prompt(
    "⚠️WARNING: Continuing will delete all data and restore intial data. If you wish to proceed, type 'continue'",
  );
  if (!input || input.toLowerCase() !== "continue") return alert("No data changed 😌");
  // Reset all data
  players.forEach(async (player) => {
    await deletePlayer(player.id);
  });
  await getPlayers(BASE + DEFAULT_COHORT + PLAYER_RESOURCE);
  getTeams(BASE + DEFAULT_COHORT + TEAM_RESOURCE);
  players.forEach((player) => {
    addPlayer(player);
  });
}

// === Components ===
/**
 * Returns an HTML form with a submit button and varying amount of label/input pairs
 * @param {string} submitTitle The text to show on the submit button
 * @param  {...any} inputs An input object. Requires a "name" property.
 * Optional type, required, value, altLabel, checked (for radio/checkbox) properties
 * @returns {HTMLFormElement}
 */
function createGenericForm(submitTitle, ...inputs) {
  const $form = document.createElement("form");
  inputs.forEach((input) => {
    const $label = document.createElement("label");
    const $input = document.createElement("input");
    $label.textContent = input.altLabel ? input.altLabel : input.name[0].toUpperCase() + input.name.substring(1);
    $input.name = input.name;
    if (input.type) $input.type = input.type;
    if (input.checked) $input.checked = input.checked;
    $input.required = input.required ? true : false;
    $input.value = input.value ? input.value : "";
    $label.append($input);
    $form.append($label);
  });
  // Once all inputs iterated on, create one last
  const $submit = document.createElement("input");
  $submit.type = "submit";
  $submit.value = submitTitle;
  $form.append($submit);
  return $form;
}

// Ref: name (req), breed (req), status (bench or field), imageUrl, teamId
function addPlayerForm() {
  // Prevent error when teams hasn't yet loaded before the form
  if (teams.length === 0) return;
  const formFields = [
    { name: "name", required: true },
    { name: "breed", required: true },
    { name: "status", type: "radio", value: "bench", altLabel: "Bench Status", checked: "checked" },
    { name: "status", type: "radio", value: "field", altLabel: "Field Status" },
    { name: "imageUrl" },
  ];
  // for (const team of teams)
  //   formFields.push({ name: "teamId", type: "radio", value: team.id, altLabel: "Team " + team.name });
  const $form = createGenericForm("🥳Add🥳", ...formFields);

  // Remove the submit to allow adding more different fields
  const $submit = $form.removeChild($form.children[$form.length - 1]);

  const $teamLabel = document.createElement("label");
  $teamLabel.textContent = "Which team:";
  $form.append($teamLabel);

  const $select = document.createElement("select");
  $select.name = "teamId";
  // Default option
  const $defaultOption = document.createElement("option");
  $defaultOption.value = "";
  $defaultOption.textContent = "Unassigned";
  $select.append($defaultOption);

  // Teams
  teams.forEach((team) => {
    const $option = document.createElement("option");
    $option.value = team.id;
    $option.textContent = team.name;
    $select.append($option);
  });
  $form.append($select);

  $form.id = "addPlayerForm";
  $form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const formData = new FormData($form);
    const player = {};
    for (const key of formData.keys()) player[key] = formData.get(key);
    addPlayer(player);
  });
  $form.append($submit);
  return $form;
}

/**
 * Creates a selectable list item with player info
 * @param {Player} player
 * @returns {HTMLLIElement}
 */
function playerListItem(player) {
  const $li = document.createElement("li");
  if (player.id === selectedPlayer?.id) $li.classList.add("selected");

  $li.innerHTML = `
  <a href="#selected"><img src="${player.imageUrl}" alt = "${player.name} - "/>${player.name}</a>
  `;
  $li.querySelector("a").addEventListener("click", () => {
    return setSelectedPlayer(player.id);
  });
  return $li;
}

/**
 * Creates an HTML ul of players
 * @returns {HTMLUListElement}
 */
function playerList() {
  const $ul = document.createElement("ul");
  players.forEach((player) => {
    $ul.append(playerListItem(player));
  });
  $ul.classList.add("players");
  return $ul;
}

/**
 * Creates a section HTML element containing the selected player's info, or a 'p' tag if no selection
 * @returns {HTMLParagraphElement | HTMLElement}
 */
function selectedPlayerComponent() {
  if (!selectedPlayer) {
    const $p = document.createElement("p");
    $p.textContent = "Please select a puppy.";
    return $p;
  }

  const $player = document.createElement("section");
  $player.innerHTML = `
  <img src="${selectedPlayer.imageUrl}" alt="${selectedPlayer.name}"/>
  <button>💀Delete💀<img src="https://img.magnific.com/premium-vector/cute-sad-dog-cartoon-sticker-vector-illustration_1234575-802.jpg" alt = "sad-dog"/></button>
  <p><b>Name</b> ${selectedPlayer.name}</p>
  <p><b>ID</b> ${selectedPlayer.id}</p>
  <p><b>Breed</b> ${selectedPlayer.breed}</p>
  <p><b>Team</b> ${selectedPlayer.team ? selectedPlayer.team.name : "Unassigned"}</p>
  <p><b>Status</b> ${selectedPlayer.status}</p>
  `;
  $player.querySelector("button").addEventListener("click", () => {
    deletePlayer(selectedPlayer.id);
    selectedPlayer = null;
  });

  return $player;
}

// === Render ===
function render() {
  const $app = document.querySelector("#app");
  $app.innerHTML = `
  <div class="center">
    <h1> Annual Puppy Bowl - Admin </h1>
    <button>Reset data</button>
  </div>
  <main>
    <section>
        <h2>🐕All Puppies🐕</h2>
        <playerList></playerList>
        <h2>🎂Add Puppy🎂</h2>
        <form></form>
    </section>
    <section id="selected">
        <h2>Puppy Details</h2>
        <selectedPlayer></selectedPlayer>
    </section>
  </main>
  
  `;
  $app.querySelector("button").addEventListener("click", resetData);
  $app.querySelector("playerList").replaceWith(playerList());
  $app.querySelector("selectedPlayer").replaceWith(selectedPlayerComponent());
  $app.querySelector("form").replaceWith(addPlayerForm());
}

async function init() {
  await getPlayers();
  await getTeams();
}

init();

const fetch = require("node-fetch");

const starWarsSearchProvider = {
  domain: 'Star Wars characters ( try "Skywalker")',
  execute: async (searchTerm) => {
    const result = await fetch(
      `https://swapi.co/api/people/?format=json&search=${searchTerm}`
    ).then((result) => result.json());

    return {
      term: searchTerm,
      message: `Searched for ${searchTerm} with Star Wars search provider`,
      list: result.results,
    };
  },
};

const gameOfThronesSearchProvider = {
  domain: 'Game of Thrones characters ( try "Jon Snow")',
  execute: async (searchTerm) => {
    const result = await fetch(
      `https://anapioficeandfire.com/api/characters/?&name=${searchTerm}`
    ).then((result) => result.json());

    const characters = result.map((character) => {
      return {
        name: character.name || character.aliases[0],
        gender: character.gender,
      };
    });

    return {
      term: searchTerm,
      message: `Searched for ${searchTerm} with Game of Thrones search provider`,
      list: characters,
    };
  },
};

const searchProviders = {
  143: starWarsSearchProvider,
  304: gameOfThronesSearchProvider,
};

function getSearchProvider(providerId) {
  return searchProviders[providerId];
}

module.exports = { getSearchProvider };

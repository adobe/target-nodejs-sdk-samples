const fetch = require("node-fetch");

const starWarsSearchProvider = {
  domain: 'a Star Wars character ( try "skywalker")',
  execute: async (searchTerm) => {
    const result = await fetch(
      `https://swapi.co/api/people/?format=json&search=${searchTerm}`
    ).then((result) => result.json());

    const list = result.results;

    return {
      term: searchTerm,
      message: `Searched for ${searchTerm} with Star Wars search provider`,
      list,
    };
  },
};

const starTrekSearchProvider = {
  domain: 'a Star Trek character ( try "picard")',
  execute: async (searchTerm) => {
    const searchParams = new URLSearchParams();
    searchParams.set("title", searchTerm);
    searchParams.set("name", searchTerm);

    const result = await fetch(`http://stapi.co/api/v1/rest/character/search`, {
      method: "POST",
      body: searchParams,
    }).then((result) => result.json());

    const list = (result.characters || []).map((character) => {
      return {
        name: character.name,
        gender: character.gender,
        birth_year: character.yearOfBirth,
      };
    });

    return {
      term: searchTerm,
      message: `Searched for ${searchTerm} with Star Wars search provider`,
      list,
    };
  },
};

const searchProviders = {
  startrek: starTrekSearchProvider,
  starwars: starWarsSearchProvider,
};

function getSearchProvider(providerId) {
  return searchProviders[providerId];
}

module.exports = { getSearchProvider };

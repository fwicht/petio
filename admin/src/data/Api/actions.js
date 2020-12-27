import { store } from "../store";
import * as types from "../actionTypes";
import * as api from "./api";

function finalise(data = false) {
  if (!data) return false;
  return store.dispatch(data);
}

export async function getPopular() {
  let popular = await api.popular();

  if (popular) {
    popular.movies.forEach((movie) => {
      movie.isMinified = true;
      finalise({
        type: types.MOVIE_LOOKUP,
        movie: movie,
        id: movie.id,
      });
    });

    popular.tv.forEach((series) => {
      series.isMinified = true;
      finalise({
        type: types.SERIES_LOOKUP,
        series: series,
        id: series.id,
      });
    });

    finalise({
      type: types.POPULAR,
      popular: {
        movies: popular.movies,
        tv: popular.tv,
        people: popular.people,
      },
    });
  }
}

export async function movie(id, minified = false) {
  let movie = await api.movie(id, minified);

  movie.isMinified = minified;

  finalise({
    type: types.MOVIE_LOOKUP,
    movie: movie,
    id: id,
  });
}

export async function series(id, minified = false) {
  let series = await api.series(id, minified);

  if (!series.id) {
    return false;
  }

  series.isMinified = minified;

  finalise({
    type: types.SERIES_LOOKUP,
    series: series,
    id: id,
  });
}

export async function person(id) {
  let data = await api.actor(id);

  let movies = data.movies;
  let shows = data.tv;
  let info = data.info;

  finalise({
    type: types.PERSON_LOOKUP,
    person: info,
    id: id,
  });

  if (movies.length === 0) {
    finalise({
      type: types.STORE_ACTOR_MOVIE,
      cast: {},
      crew: {},
      id: id,
    });
  } else {
    finalise({
      type: types.STORE_ACTOR_MOVIE,
      cast: movies.cast,
      crew: movies.crew,
      id: id,
    });
  }
  if (shows.length === 0) {
    finalise({
      type: types.STORE_ACTOR_SERIES,
      cast: {},
      crew: {},
      id: id,
    });
  } else {
    finalise({
      type: types.STORE_ACTOR_SERIES,
      cast: shows.cast,
      crew: shows.crew,
      id: id,
    });
  }
}

export async function search(term) {
  let searchResults = await api.search(term);

  return new Promise((resolve, reject) => {
    if (!searchResults) {
      reject();
    }
    searchResults.movies.forEach((movie) => {
      movie.isMinified = true;
      finalise({
        type: types.MOVIE_LOOKUP,
        movie: movie,
        id: movie.id,
      });
    });

    searchResults.shows.forEach((series) => {
      // console.log(series);
      series.isMinified = true;
      finalise({
        type: types.SERIES_LOOKUP,
        series: series,
        id: series.id,
      });
    });

    finalise({
      type: types.SEARCH,
      movies: searchResults.movies,
      series: searchResults.shows,
      people: searchResults.people,
    });

    resolve();
  });
}

export function clearSearch() {
  finalise({
    type: types.SEARCH,
    movies: [],
    series: [],
    people: [],
  });
}

export let top = (type) => {
  return new Promise((resolve, reject) => {
    api
      .top(type)
      .then((data) => {
        const sorted = Object.values(data)
          .sort((a, b) => a.globalViewCount - b.globalViewCount)
          .reverse();

        resolve(sorted);
      })
      .catch((err) => {
        console.log(err);
        reject("Error getting plex movies");
      });
  });
};

export async function history(user_id, type) {
  return new Promise((resolve, reject) => {
    api
      .history(user_id, type)
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        console.log(err);
        reject("Error getting plex movies");
      });
  });
}

export let get_plex_media = (id, type) => {
  return new Promise((resolve, reject) => {
    api
      .get_plex_media(id, type)
      .then((res) => {
        resolve(res);

        if (type === "movie") {
          finalise({
            type: types.MOVIE_LOOKUP,
            movie: movie,
            id: movie.id,
          });
        } else {
          finalise({
            type: types.SERIES_LOOKUP,
            movie: series,
            id: series.id,
          });
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export let bandwidth = () => {
  return new Promise((resolve, reject) => {
    api
      .getBandwidth()
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export let serverInfo = () => {
  return new Promise((resolve, reject) => {
    api
      .getServerInfo()
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export let currentSessions = () => {
  return new Promise((resolve, reject) => {
    api
      .getCurrentSessions()
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

export function checkConfig() {
  return new Promise((resolve, reject) => {
    api
      .checkConfig()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
}

export function saveConfig(config) {
  return new Promise((resolve, reject) => {
    api
      .saveConfig(config)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
}

export async function sonarrConfig() {
  let config = await api.sonarrConfig();

  return config;
}

export async function sonarrOptions(id) {
  let paths = await api.sonarrPaths(id);
  let profiles = await api.sonarrProfiles(id);

  return {
    paths: paths,
    profiles: profiles,
  };
}

export async function radarrConfig() {
  let config = await api.radarrConfig();

  return config;
}

export async function radarrOptions(id) {
  let paths = await api.radarrPaths(id);
  let profiles = await api.radarrProfiles(id);

  return {
    paths: paths,
    profiles: profiles,
  };
}

export function saveSonarrConfig(config) {
  return new Promise((resolve, reject) => {
    api
      .saveSonarrConfig({ data: JSON.stringify(config) })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
}

export function testSonarr(id) {
  return new Promise((resolve, reject) => {
    api
      .testSonarr(id)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
}

export function testRadarr(id) {
  return new Promise((resolve, reject) => {
    api
      .testRadarr(id)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
}

export function saveRadarrConfig(config) {
  return new Promise((resolve, reject) => {
    api
      .saveRadarrConfig({ data: JSON.stringify(config) })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
}

export function saveEmailConfig(config) {
  return new Promise((resolve, reject) => {
    api
      .saveEmailConfig(config)
      .then(() => {
        resolve();
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
}

export function getEmailConfig() {
  return new Promise((resolve, reject) => {
    api
      .getEmailConfig()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
}

export function testEmail() {
  return new Promise((resolve, reject) => {
    api
      .testEmail()
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        console.log(err);
        reject();
      });
  });
}

export async function getUser(id) {
  try {
    let userData = await api.getUser(id);
    finalise({
      type: types.GET_USER,
      user: userData,
      id: userData.id,
    });
  } catch (err) {
    finalise({
      type: types.GET_USER,
      user: {
        email: "User Not Found",
        recommendationsPlaylistId: false,
        thumb: false,
        title: "User Not Found",
        username: "User Not Found",
        __v: false,
        id: false,
      },
      id: id,
    });
  }
}

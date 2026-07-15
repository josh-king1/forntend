import React, { useEffect, useState } from "react";
import Search from "./components/Search";
import hero from "./assets/hero.png";
import "./App.css";
import Spinner from "./components/Spinner";
import MovieCard from "./components/MovieCard";
import { useDebounce } from "react-use";

import {
  updateSearchCounter,
  getTrendingMovies,
} from "./appwrite";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [moviesList, setMoviesList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useDebounce(
    () => {
      setDebouncedSearchTerm(searchTerm);
    },
    1000,
    [searchTerm]
  );

  const fetchMovies = async (query = "") => {
    setLoading(true);
    setErrorMessage("");

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      if (!response.ok) {
        throw new Error("Failed to fetch movies.");
      }

      const data = await response.json();

      setMoviesList(data.results || []);

      if (query && data.results.length > 0) {
        await updateSearchCounter(query, data.results[0]);

        // Refresh trending movies after updating Appwrite
        loadTrendingMovies();
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Failed to fetch movies.");
    } finally {
      setLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();

      console.log("Trending Movies:", movies);

      setTrendingMovies(movies || []);
    } catch (error) {
      console.error("Error fetching trending movies:", error);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />

      <div className="wrapper">
        <header>
          <img src={hero} alt="Hero Banner" />

          <h1>
            Find <span className="text-gradient">Movies</span> You Can Enjoy
            Without The Hassle
          </h1>

          <Search
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
          />
        </header>

{trendingMovies.length > 0 && (
  <section className="trending-movies w-full">
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-xl font-semibold">
        Trending Movies
      </h2>

      <button className="text-sm text-purple-400 hover:underline">
        See all
      </button>
    </div>

    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
      {trendingMovies.slice(0, 5).map((movie, index) => (
        <li
          key={movie.$id || movie.id}
          className="relative flex items-end overflow-visible"
        >
          {/* Ranking Number */}
          <span
            className="
              absolute
              left-0
              bottom-0
              text-[7rem]
              md:text-[8rem]
              font-extrabold
              leading-none
              text-transparent
              [-webkit-text-stroke:3px_white]
              z-0
              select-none
            "
          >
            {index + 1}
          </span>

          {/* Single Poster */}
          <img
            src={movie.poster_url}
            alt={
              movie.searchTerm ||
              movie.SearchTerm ||
              movie.title ||
              "Trending"
            }
            className="
              relative
              ml-10
              h-72
              w-full
              rounded-xl
              object-cover
              shadow-lg
              hover:scale-105
              transition-transform
              duration-300
              z-10
            "
          />
        </li>
      ))}
    </ul>
  </section>
)}

        <section className="all-movies mt-12">
          <h2 className="text-2xl font-bold mb-5">All Movies</h2>

          {loading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {moviesList.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
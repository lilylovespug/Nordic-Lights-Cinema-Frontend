import { useState } from 'react';
import { Button } from '@nextui-org/button';
import { Spacer } from '@nextui-org/spacer';
import { useLocation, useNavigate } from '@remix-run/react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

import Anime from '~/assets/icons/AnimeIcon';
import Category from '~/assets/icons/CategoryIcon';
import Filter from '~/assets/icons/FilterIcon';
import Movie from '~/assets/icons/MovieIcon';
import Search from '~/assets/icons/SearchIcon';
import TrendingUp from '~/assets/icons/TrendingUpIcon';
import TvShows from '~/assets/icons/TvIcon';
import TwoUsers from '~/assets/icons/TwoUsersIcon';

const categoryPages = [
  {
    name: 'Finland',
    icon: <Movie fill="currentColor" />,
    country: 'finland',
  },
  {
    name: 'America',
    icon: <TvShows fill="currentColor" />,
    country: 'america',
  },
];

interface CinemaPage {
  name: string;
  path: string;
  icon: JSX.Element;
}

// let cinemaPages = [
//   {
//     name: 'movie-genres',
//     path: '/genres/movie',
//     icon: <Movie fill="currentColor" />,
//   },
//   {
//     name: 'tv-show-genres',
//     path: '/genres/tv',
//     icon: <Movie fill="currentColor" />,
//   },
//   {
//     name: 'anime-genres',
//     path: '/genres/anime',
//     icon: <Anime fill="currentColor" />,
//   },
//   {
//     name: 'featured-lists',
//     path: '/lists',
//     icon: <Category fill="currentColor" />,
//   },
// ];

const loadCinemasAsync = async (country: string) => {
  const countrycode = country === 'finland' ? 'fi' : 'us';

  const url = 'http://localhost:5000/api/cinemas/' + countrycode;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  return data.map((cinema: any) => {
    return {
      name: cinema.name,
      path: `/discover/movies?cinemaId=${cinema.id}&country=${countrycode}`,
      icon: <TwoUsers fill="currentColor" />,
    };
  });
};

const DiscoverPage = () => {
  const { t } = useTranslation('discover');
  const navigate = useNavigate();
  const location = useLocation();
  const [cinemaPages, setCinemaPages] = useState<CinemaPage[]>([]);
  return (
    <motion.div
      key={location.key}
      initial={{ x: '-10%', opacity: 0 }}
      animate={{ x: '0', opacity: 1 }}
      exit={{ x: '10%', opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex w-full flex-col items-start justify-center px-3"
    >
      <h1>{t('discover')}</h1>
      {/* <Spacer y={2.5} />
      <Button
        startContent={<Search fill="currentColor" />}
        type="button"
        fullWidth
        onPress={() => {
          navigate('/search/movie');
        }}
      >
        {t('search')}
      </Button>
      <Spacer y={3} />
      <Button
        startContent={<Filter fill="currentColor" />}
        type="button"
        onPress={() => {
          navigate('/discover/movies');
        }}
      >
        {t('filter')}
      </Button> */}
      <Spacer y={7} />
      <div className="flex w-full flex-col items-start justify-center">
        <h4>{t('Countries')}</h4>
        <Spacer y={2.5} />
        <div className="flex w-full flex-wrap gap-x-2 gap-y-4">
          {categoryPages.map((page) => (
            <Button
              key={page.name}
              startContent={page.icon}
              type="button"
              onPress={async () => {
                if (page.country) {
                  setCinemaPages(await loadCinemasAsync(page.country));
                } else {
                  setCinemaPages([]);
                }

                console.log({ cinemaPages });
              }}
            >
              {t(page.name)}
            </Button>
          ))}
        </div>
      </div>
      <Spacer y={7} />
      <div className="flex w-full flex-col items-start justify-center">
        <h4>{t('Cinemas')}</h4>
        <Spacer y={2.5} />
        <div className="flex w-full flex-wrap gap-x-2 gap-y-4">
          {cinemaPages.map((page) => (
            <Button
              key={page.name}
              startContent={page.icon}
              type="button"
              onPress={() => {
                navigate(page.path);
              }}
            >
              {t(page.name)}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default DiscoverPage;

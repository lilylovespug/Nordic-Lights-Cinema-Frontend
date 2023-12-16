import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData, useNavigate, useParams } from '@remix-run/react';
import { mergeMeta } from '~/utils';
import { useTranslation } from 'react-i18next';

import type { Handle } from '~/types/handle';
import type { loader as movieIdLoader } from '~/routes/movies+/$movieId';
import { authenticate, getSessionFromCookie } from '~/services/supabase';
import { getCredits, getRecommendation, getSimilar, getVideos } from '~/services/tmdb/tmdb.server';
import { postFetchDataHandler } from '~/services/tmdb/utils.server';
import { useTypedRouteLoaderData } from '~/utils/react/hooks/useTypedRouteLoaderData';
import { CACHE_CONTROL } from '~/utils/server/http';
import MediaList from '~/components/media/MediaList';
import { BreadcrumbItem } from '~/components/elements/Breadcrumb';
import { Button } from '@nextui-org/button';
import { IMovieDetail } from '~/services/tmdb/tmdb.types';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  await authenticate(request, undefined, true);

  console.log({ 'index_params': params });

  const authCookie = await getSessionFromCookie(request.headers.get('Cookie'));
  const jwt = authCookie?.data?.auth_token?.access_token;

  return json(
    {
      similar: {
        items: [],
      },
      videos: {
        items: [],
      },
      credits: {
        cast: [],
        crew: [],
      },
      recommendations: {
        items: [],
      },
      jwt
    },
    {
      headers: {
        'Cache-Control': CACHE_CONTROL.detail,
      },
    },
  );
};

export const meta = mergeMeta<typeof loader, { 'routes/movies+/$movieId': typeof movieIdLoader }>(
  ({ matches, params }) => {
    const movieData = matches.find((match) => match.id === 'routes/movies+/$movieId')?.data;
    if (!movieData) {
      return [
        { title: 'Missing Movie' },
        { name: 'description', content: `There is no movie with ID: ${params.movieId}` },
      ];
    }

    console.log({ movieData });
    const { detail } = movieData;
    const { title } = detail || {};
    return [
      { title: `Lights - ${title}` },
      { property: 'og:title', content: `Lights - ${title}` },
      { property: 'og:url', content: `https://sorachill.vercel.app/movies/${params.movieId}/` },
      { property: 'twitter:title', content: `Sora - ${title}` },
    ];
  },
);

export const handle: Handle = {
  breadcrumb: ({ match, t }) => (
    <BreadcrumbItem
      to={`/movies/${match.params.movieId}/`}
      key={`movies-${match.params.movieId}-overview`}
    >
      {t('overview')}
    </BreadcrumbItem>
  ),
};

const MovieOverview = () => {
  const movieData = useTypedRouteLoaderData('routes/movies+/$movieId');
  const detail = movieData && movieData.detail;

  const navigate = useNavigate();
  const { movieId } = useParams();
  const { t } = useTranslation();
  const onClickViewMore = (type: 'cast' | 'similar' | 'recommendations') => {
    navigate(`/movies/${detail?.id}/${type}`);
  };
  const { jwt } = useLoaderData<typeof loader>();
  const createOrder = async (movieDetail: IMovieDetail) => {
    const createOrderUrl = `http://localhost:5000/api/orders`;

    const segments = movieId?.split('|') ?? [];
    const { country, cinemaId, realMovieId, showId } = {
      country: segments[0],
      cinemaId: segments[1],
      realMovieId: segments[2],
      showId: segments[3],
    };

    const body = {
      region: country,
      showId: showId,
      movieId: realMovieId,
    }

    await fetch(createOrderUrl, {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${jwt}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    alert('Buy ticket successfully!');
    navigate(`/watch-history`);
  }

  return (
    <div className="mt-3 flex w-full max-w-[1920px] flex-col gap-x-0 gap-y-4 px-3 sm:flex-row sm:items-stretch sm:justify-center sm:gap-x-4 sm:gap-y-0 sm:px-3.5 xl:px-4 2xl:px-5">
      <div className="flex w-full grow-0 flex-col sm:w-1/3 sm:items-center sm:justify-start">
        <div className="flex w-full flex-col items-start justify-center gap-y-4 rounded-large bg-content1 p-4 nextui-sm:w-3/4 xl:w-1/2">
          <div className="flex w-full flex-row items-center justify-start gap-x-4 sm:flex-col sm:items-start sm:justify-center">
            <p className="grow">{detail?.title}</p>
          </div>
          <div className="flex w-full flex-row items-center justify-start gap-x-4 sm:flex-col sm:items-start sm:justify-center">
            <img src={detail?.poster_path ?? ''} alt="" />
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col sm:w-2/3">
        <div className="flex flex-col items-start justify-start gap-y-4 rounded-large bg-content1 p-4">
          <p className="text-justify">{detail?.overview}</p>

          <Button
            type="button"
            size="lg"
            className="w-full bg-gradient-to-br from-secondary to-primary to-50% text-lg font-bold text-primary-foreground sm:w-auto"
            onClick={async () => {
              await createOrder(detail);
            }}
          >
            {'Buy Ticket'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MovieOverview;

import { useEffect, useRef } from 'react';
import { useIntersectionObserver } from '@react-hookz/web';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Outlet, useLoaderData, useLocation } from '@remix-run/react';
import { mergeMeta } from '~/utils';
import { motion, useTransform } from 'framer-motion';
import Vibrant from 'node-vibrant';

import type { Handle } from '~/types/handle';
import { i18next } from '~/services/i18n';
import { authenticate } from '~/services/supabase';
import { getImdbRating, getMovieDetail } from '~/services/tmdb/tmdb.server';
import type { IMovieDetail } from '~/services/tmdb/tmdb.types';
import TMDB from '~/utils/media';
import useColorDarkenLighten from '~/utils/react/hooks/useColorDarkenLighten';
import { useCustomHeaderChangePosition } from '~/utils/react/hooks/useHeader';
import { useHydrated } from '~/utils/react/hooks/useHydrated';
import { useSoraSettings } from '~/utils/react/hooks/useLocalStorage';
import { CACHE_CONTROL } from '~/utils/server/http';
import { useHeaderStyle } from '~/store/layout/useHeaderStyle';
import { useLayout } from '~/store/layout/useLayout';
import { movieTvDetailsPages } from '~/constants/tabLinks';
import { MediaBackgroundImage, MediaDetail } from '~/components/media/MediaDetail';
import { BreadcrumbItem } from '~/components/elements/Breadcrumb';
import ErrorBoundaryView from '~/components/elements/shared/ErrorBoundaryView';
import TabLink from '~/components/elements/tab/TabLink';
import { backgroundStyles } from '~/components/styles/primitives';

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const [, locale] = await Promise.all([
    authenticate(request, undefined, true),
    i18next.getLocale(request),
  ]);

  console.log({params});
  const { movieId } = params;
  const segments = movieId?.split('|') ?? [];
  const { country, cinemaId, realMovieId, showId } = {
    country: segments[0],
    cinemaId: segments[1],
    realMovieId: segments[2],
    showId: segments[3],
  };

  // const mid = Number(movieId);
  // if (!mid) throw new Response('Not Found', { status: 404 });
  const detail = await getMovieDetail(realMovieId!);
  
  //if (!detail) throw new Response('Not Found', { status: 404 });
  // const extractColorImageUrl =
  //   process.env.NODE_ENV === 'development'
  //     ? TMDB.backdropUrl(detail?.backdrop_path || detail?.poster_path || '', 'w300')
  //     : `https://corsproxy.io/?${encodeURIComponent(
  //         TMDB.backdropUrl(detail?.backdrop_path || detail?.poster_path || '', 'w300'),
  //       )}`;
  let titleEng =
    detail?.original_language === 'en'
      ? detail?.original_title
      : locale === 'en'
        ? detail?.title
        : '';

  return json(
    {
      detail: {
        ...detail,
        color: 'black',
        titleEng,
      },
    },
    {
      headers: {
        'Cache-Control': CACHE_CONTROL.movie,
      },
    },
  );
};

// export const meta = mergeMeta<typeof loader>(({ data, params }) => {
//   if (!data) {
//     return [];
//   }
//   const { detail } = data;
//   const { title, overview } = detail || {};
//   const movieTitle = title || '';
//   return [
//     { name: 'description', content: overview },
//     { property: 'og:description', content: overview },
//     { name: 'twitter:description', content: overview },
//     {
//       property: 'og:image',
//       content: `https://sorachill.vercel.app/api/ogimage?m=${params.movieId}&mt=movie`,
//     },
//     {
//       name: 'keywords',
//       content: `Watch ${movieTitle}, Stream ${movieTitle}, Watch ${movieTitle} HD, Online ${movieTitle}, Streaming ${movieTitle}, English, Subtitle ${movieTitle}, English Subtitle`,
//     },
//     {
//       name: 'twitter:image',
//       content: `https://sorachill.vercel.app/api/ogimage?m=${params.movieId}&mt=movie`,
//     },
//   ];
// });

export const handle: Handle = {
  breadcrumb: ({ match }) => (
    <BreadcrumbItem to={`/movies/${match.params.movieId}`} key={`movies-${match.params.movieId}`}>
      {(match.data as { detail: IMovieDetail })?.detail?.title || match.params.movieId}
    </BreadcrumbItem>
  ),
  miniTitle: ({ match, t }) => ({
    title: (match.data as { detail: IMovieDetail })?.detail?.title || '',
    subtitle: t('overview'),
    showImage: (match.data as { detail: IMovieDetail })?.detail?.poster_path !== undefined,
    imageUrl: TMDB?.posterUrl(
      (match.data as { detail: IMovieDetail })?.detail?.poster_path || '',
      'w92',
    ),
  }),
  preventScrollToTop: true,
  disableLayoutPadding: true,
  customHeaderBackgroundColor: true,
  customHeaderChangeColorOnScroll: true,
};

const MovieDetail = () => {
  const { detail } = useLoaderData<typeof loader>();
  const { state } = useLocation();
  const isHydrated = useHydrated();
  const { backgroundColor } = useColorDarkenLighten();
  const { sidebarBoxedMode } = useSoraSettings();
  const { viewportRef, scrollY } = useLayout((scrollState) => scrollState);
  const { setBackgroundColor, startChangeScrollPosition } = useHeaderStyle(
    (headerState) => headerState,
  );
  const paddingTop = useTransform(
    scrollY,
    [0, startChangeScrollPosition, startChangeScrollPosition + 100],
    [16, 16, startChangeScrollPosition ? 0 : 16],
  );
  const paddingBottom = useTransform(
    scrollY,
    [0, startChangeScrollPosition, startChangeScrollPosition + 100],
    [32, 32, startChangeScrollPosition ? 0 : 32],
  );
  const tabLinkRef = useRef<HTMLDivElement>(null);
  const tablinkIntersection = useIntersectionObserver(tabLinkRef, {
    root: viewportRef,
    rootMargin: sidebarBoxedMode ? '-180px 0px 0px 0px' : '-165px 0px 0px 0px',
    threshold: [0.5],
  });

  useCustomHeaderChangePosition(tablinkIntersection);

  useEffect(() => {
    if (startChangeScrollPosition) {
      setBackgroundColor(backgroundColor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundColor, startChangeScrollPosition]);

  const currentTime = state && (state as { currentTime: number }).currentTime;
  const backdropPath = detail?.backdrop_path
    ? TMDB?.backdropUrl(detail?.backdrop_path || '', 'w1280')
    : undefined;

  return (
    <>
      <MediaBackgroundImage backdropPath={backdropPath} backgroundColor={backgroundColor} />
      <div className="relative top-[-80px] w-full sm:top-[-200px]">
        {/* <MediaDetail
          type="movie"
          item={detail}
          color="black"
          trailerTime={currentTime}
        /> */}
        <div className="flex w-full flex-col items-center justify-center">
          <motion.div
            className="sticky top-[61px] z-[1000] flex w-full justify-center transition-[padding] duration-100 ease-in-out"
            style={{
              backgroundColor: isHydrated ? backgroundColor : 'transparent',
              paddingTop,
              paddingBottom,
            }}
            ref={tabLinkRef}
          >
            <div
              className={backgroundStyles({ tablink: true })}
              style={{ backgroundColor: isHydrated ? backgroundColor : 'transparent' }}
            />
            <TabLink pages={movieTvDetailsPages} linkTo={`/movies/${detail?.id}`} />
          </motion.div>
          <Outlet />
        </div>
      </div>
    </>
  );
};

export function ErrorBoundary() {
  return (
    <ErrorBoundaryView
      statusHandlers={{
        404: ({ params }) => <p>There is no movie with the ID: {params.movieId}</p>,
      }}
    />
  );
}

export default MovieDetail;

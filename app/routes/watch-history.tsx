import { useState } from 'react';
import { Button } from '@nextui-org/button';
import { Checkbox, CheckboxGroup } from '@nextui-org/checkbox';
import { Input } from '@nextui-org/input';
import { Pagination } from '@nextui-org/pagination';
import { useMediaQuery } from '@react-hookz/web';
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData, useLocation, useNavigate } from '@remix-run/react';
import { mergeMeta } from '~/utils';

import type { Handle } from '~/types/handle';
import { authenticate, getCountHistory, getHistory, getSessionFromCookie, type IHistory } from '~/services/supabase';
import { CACHE_CONTROL } from '~/utils/server/http';
import HistoryItem from '~/components/media/item/HistoryItem';
import { BreadcrumbItem } from '~/components/elements/Breadcrumb';
import { User } from '@supabase/supabase-js';

interface Order {
  id: string;
  userId: number;
  region: string | null;
  showId: string;
  time: Date;
  status: number;
}

interface Cinema {
  id: string;
  name: string;
}

interface Show {
  id: string;
  cinemaId: string;
  movieId: string;
  time: Date;
  price: number;
}

interface Movie {
  id: string;
  name: string;
  cover: string;
  description: string;
}

interface FullOrder extends Order {
  cinema: Cinema;
  show: Show;
  movie: Movie;
}

export const handle: Handle = {
  breadcrumb: ({ t }) => (
    <BreadcrumbItem to="/watch-history" key="watch-history">
      {t('watch-history')}
    </BreadcrumbItem>
  ),
  getSitemapEntries: () => null,
  miniTitle: ({ t }) => ({
    title: t('watch-history'),
    showImage: false,
  }),
};

export const meta = mergeMeta(() => [
  { title: 'Sora - Orders' },
  { name: 'description', content: 'Orders' },
  { property: 'og:title', content: 'Sora - Orders' },
  { property: 'og:description', content: 'Orders' },
  { name: 'twitter:title', content: 'Sora - Orders' },
  { name: 'twitter:description', content: 'Orders' },
]);

export const loader = async ({ request }: LoaderFunctionArgs) => {

  const user = await authenticate(request, true, true);
  if(!user){
    console.log('user not found');
  }

  const authCookie = await getSessionFromCookie(request.headers.get('Cookie'));
  const jwt = authCookie?.data?.auth_token?.access_token;

  const getOrdersUrl = 'http://localhost:5000/api/orders';
  const orders: FullOrder[] = await (await fetch(getOrdersUrl, {
    headers: {
      'Authorization': `Bearer ${jwt}`,
    },
  })).json();

  console.log({orders})

  const histories = orders.map((order) => ({
    id: order.id,
    media_type: 'movie',
    movie_id: order.movie?.id,
    movie_name: order.movie?.name,
    movie_cover: order.movie?.cover,
    title: order.movie?.name,
    poster: order.movie?.cover,
    overview: order.movie?.description,
    time: order.time ?? new Date(),
    price: order.show.price ?? 0,
    duration: 0,
    user_id: order.userId,
    route: `/movie/${order.movie?.id}`,
    created_at: order.time ?? new Date(),
    updated_at: order.time ?? new Date(),
    watched: 0,
    media_id: order.movie?.id,
    status: order.status,
  }));

  console.log({histories})


  //const { searchParams } = new URL(request.url);
  const page = 1;
  // const types = searchParams.get('types');
  // const from = searchParams.get('from');
  // const to = searchParams.get('to');

  return json(
    {
      histories: histories ?? [],
      totalPage: 1,
      page,
      jwt
    },
    {
      headers: {
        'Cache-Control': CACHE_CONTROL.default,
      },
    },
  );
};

const History = () => {
  const { histories, page, totalPage, jwt } = useLoaderData<typeof loader>();
  const isSm = useMediaQuery('(max-width: 650px)', { initializeWithValue: false });
  const navigate = useNavigate();
  const location = useLocation();

  const sParams = new URLSearchParams(location.search);

  const [types, setTypes] = useState<string[]>(sParams.get('types')?.split(',') || []);
  const [from, setFrom] = useState<string | undefined>(sParams.get('from') || '');
  const [to, setTo] = useState<string | undefined>(sParams.get('to') || '');

  const searchHistoryHandler = () => {
    const params = new URLSearchParams();
    if ([1, 2].includes(types?.length)) params.append('types', types?.join(','));
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    navigate(`/watch-history?${params.toString()}`);
  };

  const paginationChangeHandler = (_page: number) => {
    const url = new URL(document.URL);
    url.searchParams.set('page', _page.toString());
    navigate(`${url.pathname}${url.search}`);
  };

  return (
    <div className="flex w-full flex-col justify-start gap-6 px-3 sm:px-0">
      <h2>My orders</h2>
      {/* <div className="flex flex-row flex-wrap items-center justify-start gap-6">
        <CheckboxGroup
          label="Select media types"
          orientation="horizontal"
          color="primary"
          defaultValue={types}
          onValueChange={setTypes}
        >
          <Checkbox value="movie">Movie</Checkbox>
          <Checkbox value="tv">TV Show</Checkbox>
          <Checkbox value="anime">Anime</Checkbox>
        </CheckboxGroup>
        <div className="flex gap-x-2">
          <Input
            label="From"
            type="date"
            placeholder="Enter your date"
            value={from || undefined}
            onValueChange={setFrom}
          />
          <Input
            label="To"
            type="date"
            placeholder="Enter your date"
            value={to || undefined}
            onValueChange={setTo}
          />
        </div>
      </div> */}
      <Button
        type="button"
        color="primary"
        size="md"
        onPress={searchHistoryHandler}
        className="w-48"
      >
        Search History
      </Button>
      <div className="grid w-full grid-cols-1 justify-items-center gap-4 xl:grid-cols-2">
        {histories.map((item) => (
          <HistoryItem key={item.id} item={item as unknown as IHistory} jwt={jwt} />
        ))}
      </div>
      {totalPage > 1 ? (
        <div className="mt-7 flex justify-center">
          <Pagination
            // showControls={!isSm}
            total={totalPage}
            initialPage={page}
            // shadow
            onChange={paginationChangeHandler}
            {...(isSm && { size: 'sm' })}
          />
        </div>
      ) : null}
    </div>
  );
};

export default History;

'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type * as Leaflet from 'leaflet';
import type { ParisEvent } from '../types';

export function EventsMap({
  events,
  selectedId,
  onSelect,
}: {
  events: ParisEvent[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations('Events');
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const library = useRef<typeof Leaflet | null>(null);
  const markers = useRef(new Map<string, Leaflet.Marker>());
  const layer = useRef<Leaflet.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    let disposed = false;
    let created: Leaflet.Map | undefined;
    import('leaflet')
      .then((L) => {
        if (disposed || !element.current) return;
        library.current = L;
        created = L.map(element.current, {
          scrollWheelZoom: false,
          maxBounds: [
            [48.75, 2.15],
            [48.98, 2.5],
          ],
          maxBoundsViscosity: 0.8,
        }).setView([48.8566, 2.3522], 12);
        map.current = created;
        L.tileLayer(
          process.env.NEXT_PUBLIC_MAP_TILE_URL ??
            'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            maxZoom: 18,
            minZoom: 10,
            attribution:
              process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ??
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        )
          .on('tileerror', () => setTileError(true))
          .addTo(created);
        layer.current = L.layerGroup().addTo(created);
        setReady(true);
      })
      .catch(() => setTileError(true));
    return () => {
      disposed = true;
      created?.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const L = library.current;
    if (!ready || !L || !map.current || !layer.current) return;
    layer.current.clearLayers();
    markers.current.clear();
    const points: Leaflet.LatLngExpression[] = [];
    events.forEach((event, index) => {
      if (!event.coordinates) return;
      const point: Leaflet.LatLngExpression = [
        event.coordinates.lat,
        event.coordinates.lon,
      ];
      points.push(point);
      const node = document.createElement('div');
      const heading = document.createElement('strong');
      heading.textContent = event.title;
      const venue = document.createElement('p');
      venue.textContent = event.venue;
      const link = document.createElement('a');
      link.href = event.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = t('visitSource');
      node.append(heading, venue, link);
      const marker = L.marker(point, {
        icon: L.divIcon({
          className: 'event-map-marker',
          html: `<span>${index + 1}</span>`,
          iconSize: [30, 30],
          iconAnchor: [15, 30],
        }),
        title: event.title,
      })
        .bindPopup(node)
        .on('click', () => onSelect(event.id));
      marker.addTo(layer.current!);
      markers.current.set(event.id, marker);
    });
    if (points.length)
      map.current.fitBounds(L.latLngBounds(points), {
        padding: [35, 35],
        maxZoom: 14,
      });
  }, [events, onSelect, ready, t]);
  useEffect(() => {
    if (!ready || !selectedId) return;
    const marker = markers.current.get(selectedId);
    if (marker) {
      marker.openPopup();
      map.current?.panTo(marker.getLatLng());
    }
  }, [selectedId, ready]);
  return (
    <div className="events-map-wrap">
      <div
        ref={element}
        className="events-map"
        role="region"
        aria-label={t('mapLabel')}
      />
      {!ready && !tileError && (
        <p className="events-map-loading" role="status">
          {t('mapLoading')}
        </p>
      )}
      {tileError && (
        <p className="events-map-warning" role="status">
          {t('mapUnavailable')}
        </p>
      )}
    </div>
  );
}

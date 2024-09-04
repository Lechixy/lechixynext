/* eslint-disable @next/next/no-img-element */
import React, { createContext, useEffect, useRef, useState } from "react";
import styles from "styles/main/Home.module.scss";
import socials from "utils/socials";
import { GetServerSidePropsResult, GetStaticPropsContext, NextPage } from "next";
import Head from "next/head";
import Discord from "components/Discord";
import { WebSocketContext } from "utils/lanyard";
import getIcon from "components/Icon";
import Spinner from "components/Spinner";
import { isMobile, Util } from "utils/Util";
import { ApiRespond } from "utils/types";
import { extractColors } from "extract-colors";
import { DynamicColorContext } from "utils/dynamicColor";
import Link from "next/link";

const Main: NextPage<any> = ({ background }) => {
  const [data, setData] = useState<ApiRespond | null>(null);
  const [seasonEmojis, setSeasonEmojis] = useState("");
  let season = Util.getSeasonName();
  const bg = background;

  const [dynamicColor, setDynamicColor] = useState(`var(--${season})`);

  useEffect(() => {
    //console.log(data)
    if (data && data.spotify) {
      extractColors(data.spotify.album_art_url, {
        crossOrigin: "anonymous"
      })
        .then(colors => {
          //console.log(colors)
          //let newColors = colors.length >= 3 ? `${colors[0].hex}, ${colors[1].hex}, ${colors[2].hex}` : `${colors[0].hex}, ${colors[1].hex}`;
          let newColors = `${colors[0].hex}, ${colors[1].hex}`
          setDynamicColor(newColors)
          let stuffs_header = document.querySelector(`.${styles.stuff_header}`) as HTMLDivElement;
          stuffs_header.style.background = `linear-gradient(to right, ${newColors})`;

          let bottom_text = document.querySelector(`.${styles.bottom_text}`) as HTMLDivElement;
          bottom_text.style.background = `linear-gradient(to right, ${newColors})`;
        })
        .catch(console.error);
    } else {
      setDynamicColor(`var(--${season})`)
      console.log("NO SPOTIFY SO SETTING SEASONAL")
      let stuffs_header = document.querySelector(`.${styles.stuff_header}`) as HTMLDivElement;
      stuffs_header.style.background = `linear-gradient(to right, ${dynamicColor})`;

      let bottom_text = document.querySelector(`.${styles.bottom_text}`) as HTMLDivElement;
      bottom_text.style.background = `linear-gradient(to right, ${dynamicColor})`;
    }
  }, [data])

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let intervalTime: number;
    let ws: WebSocket;

    const connectToWebSocket = () => {
      Util.websocketlog("Trying to connect websocket...");
      ws = new WebSocket("wss://api.lanyard.rest/socket");
      let number = 1;

      ws.addEventListener("open", () => {
        Util.websocketlog("Connected to websocket!");
      });
      ws.addEventListener("message", (message) => {
        let jsConvert = JSON.parse(message.data);
        switch (jsConvert.op) {
          // Opcode 1: Hello
          case 1:
            // Opcode 2: Initialize
            let op2 = {
              op: 2,
              d: {
                subscribe_to_id: "391511241786654721",
              },
            };

            intervalTime = jsConvert.d.heartbeat_interval;
            ws.send(JSON.stringify(op2));

            interval = setInterval(sendHeartbeat, intervalTime);
            break;


          case 0:
            Util.websocketlog(`${number++}. data received from discord, updating... `);
            let discordData = jsConvert.d;
            setData(discordData);
            break;
        }
      });
      ws.addEventListener("close", (close) => {
        if (close.code === 1000) {
          connectToWebSocket();
          return;
        }

        Util.websocketlog(`Closed websocket connection: [${close?.code}] ${close?.reason}`);
      });
      ws.addEventListener("error", (error) => {
        clearInterval(interval);
        ws.close(1000);
        Util.websocketlog(`An error occurred while websocket connection:`);
        console.log(error);
      });

      return ws;
    };
    const sendHeartbeat = () => {
      Util.websocketlog("Sending heartbeat interval...");

      if (ws.readyState === ws.CONNECTING) {
        Util.websocketlog("Still trying to connect to websocket, passing heartbeat interval");
        setData(null);
        return;
      }
      else if (ws.readyState === ws.CLOSED) {
        setData(null);
        Util.websocketlog("No websocket connection, trying to reconnect...");
        clearInterval(interval)
        ws = connectToWebSocket();
        return;
      }

      let op3 = {
        op: 3,
      };
      ws.send(JSON.stringify(op3));
    };

    ws = connectToWebSocket();
    // window.addEventListener('load', () => {
    //   const preloader = document.querySelector(`.${styles.preloader}`)
    //   preloader?.classList.add('disappear')
    //   setTimeout(() => {
    //     preloader?.remove()
    //   }, 1000)
    // })

    return () => {
      ws.close(1000);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let layer_container = document.querySelector(`.${styles.layer_container}`);

    const season = Util.getSeasonName();
    //const season = "summer"
    const seasonContent = Util.getSeasonContent(season);

    //Season Theme
    let bottom_text = document.querySelector(`.${styles.bottom_text}`) as HTMLDivElement;
    let bottom_text_span = bottom_text.querySelector(`span`) as HTMLSpanElement;
    bottom_text_span.textContent = seasonContent.seasonEmojis

    let season_tooltip = document.querySelector(`.${styles.season_tooltip} .tooltip_text`) as HTMLDivElement;
    season_tooltip.textContent = season.charAt(0).toUpperCase() + season.slice(1).toLowerCase();
    setSeasonEmojis(season.charAt(0).toUpperCase() + season.slice(1).toLowerCase());

    let interval: NodeJS.Timeout | null = null;

    if (!seasonContent.seasonParticle.length) {
      let spawnEvery = isMobile(navigator) ? 400 : 150;
      interval = setInterval(() => {
        createParticles();
      }, spawnEvery);
    }

    function createParticles() {
      let particle_div = document.createElement("div");
      particle_div.innerHTML = seasonContent.seasonParticle;
      particle_div.classList.add(styles.particle, styles[season]);

      /**
       * ! Particle Values
       */

      // Time
      let life_time = Math.floor(Math.random() * 10) + 4250;
      // Scale
      let spawn_scale = Math.random() * 0.6 + 0.5;
      let end_scale = Math.random() * 0.25 + spawn_scale;
      // Position
      let spawn_x = Math.floor(Math.random() * window.innerWidth);
      let end_x = Math.floor(Math.random() * window.innerWidth);
      let end_y = 102;
      // Opacity
      let spawn_opacity = Math.random() * 1 + 0.65;
      let end_opacity = Math.abs(Math.random() * spawn_opacity);
      // Rotation
      let rotate_start = Math.floor(Math.random() * 270) + 90;
      let rotate_end = Math.floor(Math.random() * (360 * 3));
      // Depth
      let depth = Math.round(Math.random() * 1);
      particle_div.style.zIndex = depth.toString();

      // If site in mobile version
      if (window.innerWidth < 650) {
        end_y = end_y + 50;
      }

      particle_div.animate(
        [
          {
            transform: `translateY(-2vh) translateX(${spawn_x}px) rotateZ(${rotate_start}deg) scale(${spawn_scale})`,
            opacity: spawn_opacity.toString(),
          },
          {
            transform: `translateY(${end_y}vh) translateX(${end_x}px) rotateZ(${rotate_end}deg) scale(${end_scale})`,
            opacity: end_opacity.toString(),
          },
        ],
        {
          duration: life_time,
          fill: "forwards",
          easing: "linear",
        }
      );

      layer_container?.append(particle_div);

      let clear_timeout = setTimeout(() => {
        particle_div.remove();
        clearTimeout(clear_timeout);
      }, life_time);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [data]);

  return (
    <div className={styles.main}>
      <Head>
        <title>lechixy | challenge accepted!</title>
      </Head>
      <div className={styles.background}>
        <div>
          <img src={bg} alt="background" />
        </div>
      </div>
      <WebSocketContext.Provider value={data}>
        <DynamicColorContext.Provider value={dynamicColor}>
          <div className={styles.container}>
            <div className={styles.stuff}>
              <div>
                <div className={styles.stuff_header}>
                  <div>Stuffs</div>
                </div>
                <div className={styles.stuff_item}>
                  {socials.map((social) => {
                    if (social.value == "ig") return null;
                    return (
                      <Link
                        href={social.url}
                        target={social.type && social.type != "_blank" ? social.type : "_blank"}
                        className={`${styles.app} ${styles[`app_${social.value.toLowerCase()}`]}`}
                        key={social.name}
                      >
                        {getIcon(social.value, styles)}
                        <div>{social.name}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div
                className={`season_tooltip ${styles.bottom_text}`}
              >
                <div className={`tooltip ${styles.season_tooltip}`}>
                  <div className={`tooltip_arrow ${styles.season_tooltip_arrow}`}></div>
                  <div className={"tooltip_text"}>
                  </div>
                </div>
                <span></span>
              </div>
            </div>
            <div className={styles.discord}>
              <Discord />
            </div>
          </div>
        </DynamicColorContext.Provider>
      </WebSocketContext.Provider>
      <div className={styles.layer_container} />
      {/* <div className={styles.preloader} >
        <Spinner />
      </div> */}
    </div>
  );
};

export function getServerSideProps(context: GetStaticPropsContext): GetServerSidePropsResult<any> {
  let bg = Util.getRandomBackground();

  return {
    props: {
      background: bg,
    },
  };
}

export default Main;

/** @format */

import React, { useState, useEffect } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

const PlayerSearch = () => {
  const [playerName, setPlayerName] = useState("");
  const [platform, setPlatform] = useState("kakao"); // 기본 플랫폼
  const [playerData, setPlayerData] = useState(null);
  const [rankedStats, setRankedStats] = useState(null); // 시즌 랭크 데이터
  const [currentSeasonId, setCurrentSeasonId] = useState(null); // 현재 시즌 ID
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const API_KEY =
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiIxNjJhOWUyMC03M2ZiLTAxM2QtZjgzZi01ZTQyYWFjM2UxNmUiLCJpc3MiOiJnYW1lbG9ja2VyIiwiaWF0IjoxNzI5NzQ5NTgyLCJwdWIiOiJibHVlaG9sZSIsInRpdGxlIjoicHViZyIsImFwcCI6ImZvcnN0dWR5In0.IkEfnFtr_mBky9XPA2ngIrbGn9zIotLXL9eNBjQQ1MQ";

  // 컴포넌트 로드 시 현재 시즌 ID 가져오기
  useEffect(() => {
    fetchCurrentSeason();
  }, [platform]);

  // 현재 시즌 ID 가져오기
  const fetchCurrentSeason = async () => {
    const SEASONS_URL = `https://api.pubg.com/shards/${platform}/seasons`;

    try {
      const response = await axios.get(SEASONS_URL, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      });

      console.log("Seasons Data:", response.data.data);

      // 현재 시즌 ID 확인
      const currentSeason = response.data.data.find(
        (season) => season.attributes.isCurrentSeason
      );

      if (currentSeason) {
        setCurrentSeasonId(currentSeason.id);
        console.log("Current Season ID:", currentSeason.id);
      } else {
        // Kakao 플랫폼에서 시즌 ID 문제가 있는 경우 강제로 설정
        const fallbackSeasonId = "division.bro.official.pc-2023-01"; // 최신 글로벌 시즌 ID
        setCurrentSeasonId(fallbackSeasonId);
        console.log("Fallback Season ID:", fallbackSeasonId);
        setError("Kakao 플랫폼에서 유효한 현재 시즌을 가져오지 못했습니다. 기본 시즌 ID를 사용합니다.");
      }
    } catch (err) {
      console.error("Error fetching current season:", err.response);
      setError("현재 시즌 데이터를 가져오는 중 오류가 발생했습니다.");
    }
  };

  // 플레이어 검색
  const searchPlayer = async () => {
    if (!playerName.trim()) {
      setError("플레이어 닉네임을 입력해주세요.");
      return;
    }

    if (!currentSeasonId) {
      setError("현재 시즌 정보를 불러오지 못했습니다.");
      return;
    }

    setLoading(true);
    setError("");
    setPlayerData(null);
    setRankedStats(null);

    const API_URL = `https://api.pubg.com/shards/${platform}/players?filter[playerNames]=${playerName}`;

    try {
      const response = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      });

      if (response.data && response.data.data.length > 0) {
        const player = response.data.data[0];
        setPlayerData(player);

        console.log("Player Data:", player);

        // 시즌 랭크 데이터 가져오기
        await fetchRankedStats(player.id, currentSeasonId);
      } else {
        setError("플레이어를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("Error fetching player data:", err.response);
      if (err.response?.status === 404) {
        setError("플레이어를 찾을 수 없습니다.");
      } else {
        setError("데이터를 가져오는 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 시즌 랭크 데이터 가져오기
  const fetchRankedStats = async (playerId, seasonId) => {
    if (!playerId || !seasonId) {
      setError("플레이어 ID 또는 시즌 ID가 유효하지 않습니다.");
      return;
    }

    const STATS_URL = `https://api.pubg.com/shards/${platform}/players/${playerId}/seasons/${seasonId}/ranked`;

    console.log("Ranked Stats API URL:", STATS_URL);

    try {
      const response = await axios.get(STATS_URL, {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/vnd.api+json",
        },
      });

      if (response.data && response.data.data) {
        setRankedStats(response.data.data.attributes.rankedGameModeStats.squad); // Squad 모드 데이터
      } else {
        setError("랭크 데이터를 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("Error fetching ranked stats:", err.response);
      if (err.response?.status === 404) {
        setError("플레이어가 해당 시즌에서 랭크 데이터를 보유하고 있지 않습니다.");
      } else {
        setError("랭크 데이터를 가져오는 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div style={{ maxWidth: "600px", width: "100%" }}>
        <h1 className="text-center mb-4">PUBG 전적 검색</h1>

        {/* 플랫폼 선택 */}
        <select
          className="form-select mb-3"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="kakao">Kakao</option>
          <option value="steam">Steam</option>
          <option value="xbox">Xbox</option>
          <option value="psn">PlayStation</option>
        </select>

        {/* 닉네임 입력 */}
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="플레이어 닉네임을 입력하세요"
          className="form-control mb-3"
        />

        <button onClick={searchPlayer} className="btn btn-dark w-100 mb-3">
          검색
        </button>

        {loading && <p className="text-center">로딩 중...</p>}
        {error && <p className="text-danger text-center">{error}</p>}

        {playerData && (
          <div className="border p-3">
            <h2 className="text-center">플레이어 정보</h2>
            <p>
              <strong>닉네임:</strong> {playerData.attributes.name}
            </p>
            <p>
              <strong>플랫폼:</strong> {playerData.attributes.shardId}
            </p>
            <p>
              <strong>플레이어 ID:</strong> {playerData.id}
            </p>
          </div>
        )}

{rankedStats && (
  <div className="border p-3 mt-3">
    <h2 className="text-center">랭크 정보 (현재 시즌)</h2>
    <p>
      <strong>평균 데미지:</strong> 
      {rankedStats.avgDamage ? rankedStats.avgDamage.toFixed(2) : "정보 없음"}
    </p>
    <p>
      <strong>승률:</strong>{" "}
      {rankedStats.wins && rankedStats.roundsPlayed
        ? ((rankedStats.wins / rankedStats.roundsPlayed) * 100).toFixed(2) + "%"
        : "정보 없음"}
    </p>
    <p>
      <strong>티어:</strong> 
      {rankedStats.currentTier?.tier || "정보 없음"} 
      {rankedStats.currentTier?.subTier || ""}
    </p>
    <p>
      <strong>RP:</strong> 
      {rankedStats.currentRankPoint || "정보 없음"}
    </p>
    <p>
      <strong>진행 판수:</strong> 
      {rankedStats.roundsPlayed || 0}
    </p>
  </div>
)}
      </div>
    </div>
  );
};

export default PlayerSearch;
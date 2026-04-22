"use client";
import {useEffect, useState} from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { SupabaseClient } from "@supabase/supabase-js";


export default function Home() {
  //誰が入ってるか
  const [currentBath, setCurrentBath] = useState<string | null>(null);
  //湯船orシャワー
  const [bathType,setBathType] = useState<string | null>(null);
  //Bハウスメンバー
  const housemembers = ["B-1","B-2","B-3","B-4"];

  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase.from("bath_status").select("*").eq("id",1).single()
      if (data){
        setCurrentBath(data.current_bath);
        setBathType(data.bath_type);
      }    
    };
    fetchStatus();
    const channel = supabase.channel("realtime-bath").on("postgres_changes",{event:"UPDATE",schema:"public",table:"bath_status"},(payload)=>{
      setCurrentBath(payload.new.current_bath);
      setBathType(payload.new.bathtype)
    })
    .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [])

  //入浴
  const enterBath = async (name:string,type:string) => {
    setCurrentBath(name);
    setBathType(type);

    await supabase.from("bath_status").update({ current_bath:name,bathtype:type}).eq("id",1);
  };

  const leaveBath = async () => {
    setCurrentBath(null);
    setBathType(null);

    await supabase.from("bath_status").update({current_bath:null,bathtype:null}).eq("id",1);
  };

  return (
    <div className = "min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className = "max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden p-6">
        <h1 className = "text-2xl font-bold text-center mb-6">入浴状況</h1>
        {/*状況*/}
        <div className = {`p-4 rounded-lg text-center mb-8 ${currentBath ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          <h2 className = "text-xl font-semibold">
            {currentBath ? `入浴中；${currentBath}(${bathType})` : "利用可能"}
          </h2>
        </div>
        {/*操作*/}
        <div className = "space-y-4">
          <h3 className = "font-medium text-gray-100">入浴</h3>

          {housemembers.map((user) => (
            <div key={user}>
              <span className = "font-medium mb-2 sm:mb-0">{user}</span>
              <div className = "flex space-x-2">
                <button
                  onClick={() => enterBath(user,"シャワー")}
                  disabled = {currentBath !== null && currentBath !== user}>
                  シャワー
                </button>
                <button
                  onClick = {() => enterBath(user,"湯船")}
                  disabled = {currentBath !== null && currentBath !== user}
                >
                  湯船
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => leaveBath()}
            disabled = {currentBath === null}
            className = "w-full mt-6 py-3 bg-gray-800 text-white font-bold rounded hover:bg-gray-900 disabled:bg-gray-300"
          >
            退出
          </button>
        </div>

      </div>
    </div>
  )

}
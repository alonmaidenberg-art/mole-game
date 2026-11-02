/* Chess engine: rules (castling, en passant, promotion), legal moves, simple alpha-beta AI. */
const Chess=(function(){
const P=1,N=2,B=3,R=4,Q=5,K=6;
const ND=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
const KD=[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
const BD=[[-1,-1],[-1,1],[1,-1],[1,1]],RD=[[-1,0],[1,0],[0,-1],[0,1]];
function initState(){
  const b=new Array(64).fill(0),back=[R,N,B,Q,K,B,N,R];
  for(let c=0;c<8;c++){b[c]=-back[c];b[8+c]=-P;b[48+c]=P;b[56+c]=back[c]}
  return {b,turn:1,c:{K:1,Q:1,k:1,q:1},ep:-1,half:0,full:1};
}
function fromFEN(fen){
  const [pl,tn,ca,ep,hm,fm]=fen.split(' ');const b=new Array(64).fill(0);let i=0;
  const map={p:P,n:N,b:B,r:R,q:Q,k:K};
  for(const ch of pl){if(ch==='/')continue;if(ch>='1'&&ch<='8'){i+=+ch}else{const l=ch.toLowerCase();b[i++]=(ch===l?-1:1)*map[l]}}
  return {b,turn:tn==='w'?1:-1,c:{K:ca.includes('K')?1:0,Q:ca.includes('Q')?1:0,k:ca.includes('k')?1:0,q:ca.includes('q')?1:0},
    ep:ep==='-'?-1:(8-+ep[1])*8+(ep.charCodeAt(0)-97),half:+(hm||0),full:+(fm||1)};
}
function attacked(b,sq,by){ // is square sq attacked by color 'by' (1 white, -1 black)
  const r=sq>>3,c=sq&7;
  const pr2=by===1?r+1:r-1;
  if(pr2>=0&&pr2<8){for(const dc of [-1,1]){const nc=c+dc;if(nc>=0&&nc<8&&b[pr2*8+nc]===by*P)return true}}
  for(const [dr,dc] of ND){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<8&&nc>=0&&nc<8&&b[nr*8+nc]===by*N)return true}
  for(const [dr,dc] of KD){const nr=r+dr,nc=c+dc;if(nr>=0&&nr<8&&nc>=0&&nc<8&&b[nr*8+nc]===by*K)return true}
  for(const [dr,dc] of BD){let nr=r+dr,nc=c+dc;while(nr>=0&&nr<8&&nc>=0&&nc<8){const v=b[nr*8+nc];if(v){if(v===by*B||v===by*Q)return true;break}nr+=dr;nc+=dc}}
  for(const [dr,dc] of RD){let nr=r+dr,nc=c+dc;while(nr>=0&&nr<8&&nc>=0&&nc<8){const v=b[nr*8+nc];if(v){if(v===by*R||v===by*Q)return true;break}nr+=dr;nc+=dc}}
  return false;
}
function kingSq(b,color){return b.indexOf(color*K)}
function inCheck(s,color){const k=kingSq(s.b,color);return k>=0&&attacked(s.b,k,-color)}
function pseudo(s,capsOnly){
  const out=[],b=s.b,us=s.turn;
  const add=(f,t,pr,ep)=>out.push({f,t,pr:pr||0,ep:!!ep,cs:null});
  for(let sq=0;sq<64;sq++){
    const p=b[sq];if(!p||(p>0?1:-1)!==us)continue;
    const t=Math.abs(p),r=sq>>3,c=sq&7;
    if(t===P){
      const dir=us===1?-1:1,start=us===1?6:1,promo=us===1?0:7,nr=r+dir;
      if(nr>=0&&nr<8){
        if(!capsOnly&&b[nr*8+c]===0){
          if(nr===promo)for(const pr of [Q,R,B,N])add(sq,nr*8+c,pr);else add(sq,nr*8+c);
          if(r===start&&b[(r+2*dir)*8+c]===0)add(sq,(r+2*dir)*8+c);
        }else if(capsOnly&&b[nr*8+c]===0&&nr===promo){add(sq,nr*8+c,Q)}
        for(const dc of [-1,1]){
          const nc=c+dc;if(nc<0||nc>7)continue;const ts=nr*8+nc,v=b[ts];
          if(v&&(v>0?1:-1)===-us){if(nr===promo)for(const pr of [Q,R,B,N])add(sq,ts,pr);else add(sq,ts)}
          else if(!v&&ts===s.ep)add(sq,ts,0,true);
        }
      }
    }else if(t===N||t===K){
      for(const [dr,dc] of (t===N?ND:KD)){
        const nr=r+dr,nc=c+dc;if(nr<0||nr>7||nc<0||nc>7)continue;
        const ts=nr*8+nc,v=b[ts];
        if(!v){if(!capsOnly)add(sq,ts)}else if((v>0?1:-1)===-us)add(sq,ts);
      }
      if(t===K&&!capsOnly){
        const row=us===1?7:0,ks=row*8+4;
        if(sq===ks&&!attacked(b,ks,-us)){
          const kr=us===1?s.c.K:s.c.k,qr=us===1?s.c.Q:s.c.q;
          if(kr&&!b[ks+1]&&!b[ks+2]&&b[ks+3]===us*R&&!attacked(b,ks+1,-us)&&!attacked(b,ks+2,-us))out.push({f:ks,t:ks+2,pr:0,ep:false,cs:'K'});
          if(qr&&!b[ks-1]&&!b[ks-2]&&!b[ks-3]&&b[ks-4]===us*R&&!attacked(b,ks-1,-us)&&!attacked(b,ks-2,-us))out.push({f:ks,t:ks-2,pr:0,ep:false,cs:'Q'});
        }
      }
    }else{
      const dirs=t===B?BD:t===R?RD:BD.concat(RD);
      for(const [dr,dc] of dirs){
        let nr=r+dr,nc=c+dc;
        while(nr>=0&&nr<8&&nc>=0&&nc<8){
          const ts=nr*8+nc,v=b[ts];
          if(!v){if(!capsOnly)add(sq,ts)}else{if((v>0?1:-1)===-us)add(sq,ts);break}
          nr+=dr;nc+=dc;
        }
      }
    }
  }
  return out;
}
function make(s,m){
  const b=s.b.slice(),us=s.turn,p=b[m.f],cap=b[m.t];
  const c={K:s.c.K,Q:s.c.Q,k:s.c.k,q:s.c.q};
  b[m.f]=0;
  if(m.ep){b[m.t+(us===1?8:-8)]=0}
  b[m.t]=m.pr?us*m.pr:p;
  if(m.cs==='K'){b[m.t+1]=0;b[m.t-1]=us*R}
  if(m.cs==='Q'){b[m.t-2]=0;b[m.t+1]=us*R}
  if(Math.abs(p)===K){if(us===1){c.K=0;c.Q=0}else{c.k=0;c.q=0}}
  for(const q of [m.f,m.t]){if(q===63)c.K=0;if(q===56)c.Q=0;if(q===7)c.k=0;if(q===0)c.q=0}
  let ep=-1;if(Math.abs(p)===P&&Math.abs(m.t-m.f)===16)ep=(m.f+m.t)>>1;
  return {b,turn:-us,c,ep,half:(Math.abs(p)===P||cap||m.ep)?0:s.half+1,full:s.full+(us===-1?1:0)};
}
function legal(s){
  const us=s.turn,out=[];
  for(const m of pseudo(s,false)){const n=make(s,m);if(!inCheck(n,us))out.push(m)}
  return out;
}
function perft(s,d){if(d===0)return 1;let n=0;for(const m of legal(s))n+=perft(make(s,m),d-1);return n}
function insufficient(b){
  const pcs=[];for(let i=0;i<64;i++)if(b[i]&&Math.abs(b[i])!==K)pcs.push(b[i]);
  if(!pcs.length)return true;
  if(pcs.length===1&&(Math.abs(pcs[0])===N||Math.abs(pcs[0])===B))return true;
  return false;
}
function status(s){ // 'play' | 'check' | 'mate' | 'stalemate' | 'draw50' | 'insufficient'
  const lm=legal(s),chk=inCheck(s,s.turn);
  if(!lm.length)return chk?'mate':'stalemate';
  if(insufficient(s.b))return 'insufficient';
  if(s.half>=100)return 'draw50';
  return chk?'check':'play';
}
function key(s){return s.b.join(',')+'|'+s.turn+'|'+s.c.K+s.c.Q+s.c.k+s.c.q+'|'+s.ep}
/* ---------- evaluation / search ---------- */
const VAL=[0,100,320,330,500,900,0];
const PST={
[P]:[0,0,0,0,0,0,0,0,50,50,50,50,50,50,50,50,10,10,20,30,30,20,10,10,5,5,10,25,25,10,5,5,0,0,0,20,20,0,0,0,5,-5,-10,0,0,-10,-5,5,5,10,10,-20,-20,10,10,5,0,0,0,0,0,0,0,0],
[N]:[-50,-40,-30,-30,-30,-30,-40,-50,-40,-20,0,0,0,0,-20,-40,-30,0,10,15,15,10,0,-30,-30,5,15,20,20,15,5,-30,-30,0,15,20,20,15,0,-30,-30,5,10,15,15,10,5,-30,-40,-20,0,5,5,0,-20,-40,-50,-40,-30,-30,-30,-30,-40,-50],
[B]:[-20,-10,-10,-10,-10,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,10,10,5,0,-10,-10,5,5,10,10,5,5,-10,-10,0,10,10,10,10,0,-10,-10,10,10,10,10,10,10,-10,-10,5,0,0,0,0,5,-10,-20,-10,-10,-10,-10,-10,-10,-20],
[R]:[0,0,0,0,0,0,0,0,5,10,10,10,10,10,10,5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,-5,0,0,0,0,0,0,-5,0,0,0,5,5,0,0,0],
[Q]:[-20,-10,-10,-5,-5,-10,-10,-20,-10,0,0,0,0,0,0,-10,-10,0,5,5,5,5,0,-10,-5,0,5,5,5,5,0,-5,0,0,5,5,5,5,0,-5,-10,5,5,5,5,5,0,-10,-10,0,5,0,0,0,0,-10,-20,-10,-10,-5,-5,-10,-10,-20],
[K]:[-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-30,-40,-40,-50,-50,-40,-40,-30,-20,-30,-30,-40,-40,-30,-30,-20,-10,-20,-20,-20,-20,-20,-20,-10,20,20,0,0,0,0,20,20,20,30,10,0,0,10,30,20]
};
// mirror helper: for black pieces use the vertically mirrored square (rank flip)
function mirror(i){return ((7-(i>>3))<<3)|(i&7)}
function evaluate2(s){
  let sc=0;
  for(let i=0;i<64;i++){const v=s.b[i];if(!v)continue;const t=Math.abs(v);
    if(v>0)sc+=VAL[t]+PST[t][i];else sc-=VAL[t]+PST[t][mirror(i)]}
  return s.turn===1?sc:-sc;
}
function orderScore(s,m){
  const v=s.b[m.t],p=Math.abs(s.b[m.f]);let sc=0;
  if(v)sc+=10*VAL[Math.abs(v)]-p;else if(m.ep)sc+=1000;
  if(m.pr)sc+=VAL[m.pr];
  return sc;
}
const MATE=100000;
function quiesce(s,alpha,beta,d){
  const stand=evaluate2(s);
  if(stand>=beta)return beta;
  if(stand>alpha)alpha=stand;
  if(d>=4)return alpha;
  const us=s.turn,ms=pseudo(s,true).sort((a,b)=>orderScore(s,b)-orderScore(s,a));
  for(const m of ms){
    const n=make(s,m);if(inCheck(n,us))continue;
    const sc=-quiesce(n,-beta,-alpha,d+1);
    if(sc>=beta)return beta;if(sc>alpha)alpha=sc;
  }
  return alpha;
}
function search(s,depth,alpha,beta){
  if(depth===0)return quiesce(s,alpha,beta,0);
  const ms=legal(s);
  if(!ms.length)return inCheck(s,s.turn)?-(MATE+depth):0;
  ms.sort((a,b)=>orderScore(s,b)-orderScore(s,a));
  for(const m of ms){
    const sc=-search(make(s,m),depth-1,-beta,-alpha);
    if(sc>=beta)return beta;if(sc>alpha)alpha=sc;
  }
  return alpha;
}
function bestMove(s,level){ // level 1 easy, 2 medium, 3 hard
  const ms=legal(s);if(!ms.length)return null;
  const depth=level;
  const scored=ms.map(m=>({m,sc:-search(make(s,m),depth-1,-Infinity,Infinity)+Math.random()*(level===1?220:level===2?12:3)}));
  scored.sort((a,b)=>b.sc-a.sc);
  if(level===1&&Math.random()<.18)return scored[Math.floor(Math.random()*Math.min(4,scored.length))].m;
  return scored[0].m;
}
return {P,N,B,R,Q,K,initState,fromFEN,legal,make,inCheck,status,perft,key,bestMove,attacked,evaluate:evaluate2,VAL};
})();
if(typeof module!=='undefined')module.exports=Chess;

import Image from "next/image";

export default function TeachersRepetitorsBlock() {
  return (
    <div className="flex flex-wrap gap-5 items-center justify-center">
      {/* Card 1: Учителям */}
      <div className="bg-slate-50 h-[424px] w-[356px] rounded-[48px] overflow-hidden relative p-0">
        <div className="absolute top-7 px-[32px] py-1 z-10 text-left">
          <h3 className="font-nunito font-black text-[30px] text-[#096ff5] leading-tight">
            Учителям
          </h3>
          <p className="font-inter text-[18px] text-slate-800 leading-[1.6] mt-2">
            Экономь до 3 часов в день. Загружай фото — и через 15 секунд получай результат
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[239px]">
          <Image 
            src="/images/teacher.png" 
            alt="Illustration for teachers"
            layout="fill"
            objectFit="contain"
            objectPosition="bottom"
          />
        </div>
      </div>

      {/* Card 2: Репетиторам */}
      <div className="bg-slate-50 h-[424px] w-[356px] rounded-[48px] overflow-hidden relative p-0">
        <div className="absolute top-7 px-[32px] py-1 z-10 text-left">
          <h3 className="font-nunito font-black text-[30px] text-green-500 leading-tight">
            Репетиторам
          </h3>
          <p className="font-inter text-[18px] text-slate-800 leading-[1.6] mt-2">
            Отправляй родителям объективный результат сразу после урока
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[236px]">
          <Image 
            src="/images/learning-illustration.png" 
            alt="Illustration for repetitors"
            layout="fill"
            objectFit="contain"
            objectPosition="bottom"
          />
        </div>
      </div>
    </div>
  );
}
import Image from "next/image";
import { motion } from "framer-motion";

export default function TeachersRepetitorsBlock() {
  return (
    <div className=" md:mx-0">
      <motion.div 
        className="flex flex-col gap-4 md:flex-row md:flex-wrap md:gap-5 items-center justify-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="bg-slate-50 h-[424px] w-full sm:w-[356px] rounded-3xl overflow-hidden relative p-0"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <div className="absolute top-7 px-[32px] py-1 z-10 text-left">
            <h3 className="font-nunito font-black text-2xl sm:text-[30px] text-[#096ff5] leading-tight">
              Учителям
            </h3>
            <p className="font-inter text-[18px] text-slate-800 leading-[1.6] mt-2">
              Экономь до 3 часов в день. Загружай фото — и через 15 секунд получай результат
            </p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[239px] aspect-[356/239]">
            <Image
              src="/images/teacher.png"
              alt="Illustration for teachers"
              width={356}
              height={239}
              priority
              sizes="(max-width: 640px) 100vw, 356px"
              className="object-contain object-bottom w-full h-full"
              decoding="async"
            />
          </div>
        </motion.div>

        <motion.div 
          className="bg-slate-50 h-[424px] w-full sm:w-[356px] rounded-3xl overflow-hidden relative p-0"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <div className="absolute top-7 px-[32px] py-1 z-10 text-left">
            <h3 className="font-nunito font-black text-2xl sm:text-[30px] text-green-500 leading-tight">
              Репетиторам
            </h3>
            <p className="font-inter text-[18px] text-slate-800 leading-[1.6] mt-2">
              Отправляй родителям объективный результат сразу после урока
            </p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[236px] aspect-[356/236]">
            <Image
              src="/images/learning-illustration.png"
              alt="Illustration for repetitors"
              width={356}
              height={236}
              loading="lazy"
              sizes="(max-width: 640px) 100vw, 356px"
              className="object-contain object-bottom w-full h-full"
              decoding="async"
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
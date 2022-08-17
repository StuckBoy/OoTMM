require 'json'
require 'combo/common'

module Combo::Randomizer
  def self.run()
    oot_chests = JSON.parse(File.read(File.join(Combo::PATH_DATA, 'oot/chests.json'))).freeze
    data = "\x00" * 0x20000
    256.times do |i|
      data[i * 4,4] = "\xff\xff\xff\xff"
    end
    oot_chests.keys.each_with_index do |key, i|
      value = Random.random_number(0x01..0x7b)
      key = key.to_i(16)
      raw = [key, value].pack('S>2')
      data[i * 4,4] = raw
    end
    data
  end
end